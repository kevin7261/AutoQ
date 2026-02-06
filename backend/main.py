import os  # 匯入作業系統模組，用於處理檔案路徑、讀取環境變數等
import shutil  # 匯入高階檔案操作模組，用於複製、移動或刪除檔案與目錄
import zipfile  # 匯入 ZIP 壓縮檔處理模組，用於解壓縮與壓縮檔案
import uuid  # 匯入 UUID 模組，用於產生唯一識別碼 (Task ID)，避免多人使用時檔名衝突
import json  # [新增] 匯入 JSON 模組，用於解析 OpenAI 回傳的 JSON 字串
from typing import List, Optional  # [修改] 匯入 Optional 用於標記可選參數

# 匯入 FastAPI 相關元件
from fastapi import FastAPI, UploadFile, File, Form, BackgroundTasks, HTTPException  # [新增] HTTPException 用於錯誤處理
from fastapi.responses import FileResponse, JSONResponse  # 匯入回應類別，分別用於回傳檔案與 JSON 資料
from fastapi.middleware.cors import CORSMiddleware  # 匯入 CORS (跨來源資源共享) 中介軟體，解決跨網域請求問題
from pydantic import BaseModel # [新增] 用於定義資料模型

# --- [新增] OpenAI 原生客戶端 ---
from openai import OpenAI  # 用於直接呼叫 GPT-4o 模型 API

# --- LangChain & OpenAI 相關套件 ---
# 從 LangChain 社群套件匯入各種文件讀取器
from langchain_community.document_loaders import (
    PyPDFLoader,    # 用於讀取 PDF 檔案
    Docx2txtLoader, # 用於讀取 Word (.docx) 檔案
    TextLoader,     # 用於讀取純文字檔案 (.txt, .md, .py 等)
    BSHTMLLoader    # 用於讀取 HTML 網頁檔案
)
# 匯入文字切分器，用於將長文件切成小塊，這是 RAG 的關鍵步驟
from langchain_text_splitters import RecursiveCharacterTextSplitter
# 匯入 OpenAI 的 Embeddings (向量化工具) 與 ChatOpenAI (聊天模型)
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
# 匯入 FAISS 向量資料庫，用於儲存與搜尋向量 (這是我們 RAG Zip 的核心格式)
from langchain_community.vectorstores import FAISS
# 匯入 LangChain 的基礎文件物件結構
from langchain_core.documents import Document
# 匯入檢索問答鏈 (RetrievalQA)，這是串接檢索與生成的標準流程
from langchain.chains import RetrievalQA
# 匯入提示模板 (PromptTemplate)，用於自訂 AI 的角色與指令
from langchain.prompts import PromptTemplate

# 初始化 FastAPI 應用程式實例
app = FastAPI()

# 設定 CORS (跨來源資源共享) 中介軟體
# 這讓前端網頁 (即使不同網域，例如 GitHub Pages) 也可以呼叫這個 API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允許所有來源的網域存取 (生產環境建議設定特定網域以策安全)
    allow_methods=["*"],  # 允許所有 HTTP 方法 (如 GET, POST 等)
    allow_headers=["*"],  # 允許所有 HTTP 標頭
)

# --- 設定暫存目錄結構 ---
# 定義基礎暫存目錄名稱，所有操作都會在這個資料夾內進行
BASE_TEMP_DIR = "temp_rag_processing"
# 定義上傳檔案的存放目錄
UPLOAD_DIR = os.path.join(BASE_TEMP_DIR, "uploads")
# 定義解壓縮後的檔案存放目錄
EXTRACT_DIR = os.path.join(BASE_TEMP_DIR, "extracted")
# 定義處理完成的輸出檔案 (如向量庫 Zip) 存放目錄
OUTPUT_DIR = os.path.join(BASE_TEMP_DIR, "outputs")

# 檢查上述目錄是否存在，若不存在則自動建立
for d in [UPLOAD_DIR, EXTRACT_DIR, OUTPUT_DIR]:
    os.makedirs(d, exist_ok=True)  # exist_ok=True 表示若目錄已存在則不報錯，避免程式中斷

# --- 輔助函數：清理檔案 ---
def cleanup_files(paths_to_remove: List[str], dirs_to_remove: List[str]):
    """
    背景任務函數：用於 API 回應後清理暫存檔案與資料夾
    這是一個重要的維護功能，避免伺服器硬碟空間被暫存檔塞滿
    """
    # 遍歷需要刪除的單一檔案路徑列表
    for path in paths_to_remove:
        if os.path.exists(path):  # 先檢查檔案是否存在
            try:
                os.remove(path)  # 嘗試刪除檔案
            except Exception as e:  # 如果刪除失敗 (例如檔案被佔用)
                print(f"Error removing file {path}: {e}")  # 印出錯誤訊息但不中斷程式

    # 遍歷需要刪除的資料夾路徑列表
    for dir_path in dirs_to_remove:
        if os.path.exists(dir_path):  # 先檢查資料夾是否存在
            try:
                shutil.rmtree(dir_path, ignore_errors=True)  # 遞迴刪除資料夾及其內容 (rm -rf 的效果)
            except Exception as e:  # 如果刪除失敗
                print(f"Error removing dir {dir_path}: {e}")  # 印出錯誤訊息

# --- 輔助函數：讀取單一檔案 ---
def load_single_file(file_path: str) -> List[Document]:
    """
    根據檔案的副檔名，選擇對應的 LangChain Loader 來讀取內容
    回傳一個 Document 物件列表
    """
    # 取得檔案副檔名並轉為小寫，方便判斷
    ext = os.path.splitext(file_path)[1].lower()
    try:
        # 判斷是否為 PDF
        if ext == ".pdf":
            loader = PyPDFLoader(file_path)
        # 判斷是否為 Word 檔 (.docx)
        elif ext == ".docx":
            loader = Docx2txtLoader(file_path)
        # 判斷是否為程式碼或純文字檔 (增加支援 R, Rmd, Py, Md, Txt)
        elif ext in [".txt", ".md", ".r", ".rmd", ".py"]:
            # 使用 TextLoader，並開啟自動編碼偵測 (autodetect_encoding) 以避免中文亂碼
            loader = TextLoader(file_path, encoding="utf-8", autodetect_encoding=True)
        # 判斷是否為網頁檔
        elif ext in [".html", ".htm"]:
            # 使用 BSHTMLLoader (BeautifulSoup) 解析 HTML 結構
            loader = BSHTMLLoader(file_path, open_encoding="utf-8")
        else:
            # 如果是不支援的格式 (如 jpg, xlsx)，回傳空列表，程式會自動略過
            return []
        # 執行讀取並回傳文件內容
        return loader.load()
    except Exception as e:
        # 如果讀取過程發生錯誤 (如檔案損毀)，印出錯誤並回傳空列表，確保主程式不崩潰
        print(f"⚠️ 無法讀取檔案 {file_path}: {e}")
        return []

# --- 共通函數：處理 ZIP 並回傳 Documents (用於處理原始文件 Zip) ---
def process_zip_to_docs(zip_path, extract_path):
    """
    解壓縮 ZIP 檔，並遞迴掃描目錄，讀取所有支援的原始文件
    回傳所有讀取到的 Document 物件列表
    """
    # 檢查該路徑是否為有效的 ZIP 檔
    if not zipfile.is_zipfile(zip_path):
        raise ValueError("無效的 ZIP 檔")

    # 開啟 ZIP 檔並解壓縮到指定目錄 (extract_path)
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(extract_path)

    all_documents = []  # 用於存放所有讀取到的文件
    # 定義支援的副檔名列表
    supported_exts = ('.pdf', '.docx', '.txt', '.md', '.py', '.html', '.r', '.rmd')

    # 使用 os.walk 遞迴遍歷解壓縮後的目錄 (包含子資料夾)
    for root, _, files in os.walk(extract_path):
        for filename in files:
            # 檢查檔案是否為支援的格式
            if filename.lower().endswith(supported_exts):
                # 組合完整的檔案路徑
                file_path = os.path.join(root, filename)
                # 呼叫 load_single_file 讀取該檔案
                docs = load_single_file(file_path)

                # 為讀取到的文件加入 Metadata (元數據)，這對 RAG 溯源很重要
                # 計算相對路徑 (例如: "subfolder/doc.pdf")
                rel_path = os.path.relpath(file_path, extract_path)
                for d in docs:
                    d.metadata["filename"] = filename  # 紀錄檔名
                    d.metadata["source"] = rel_path    # 紀錄相對路徑來源
                # 將處理好的文件加入總列表
                all_documents.extend(docs)

    return all_documents

# --- [新增] 輔助函數：取得 OpenAI Client ---
def get_openai_client():
    """
    初始化並回傳 OpenAI 原生客戶端，用於新 API 直接呼叫模型
    """
    api_key = os.getenv("OPENAI_API_KEY")  # 從環境變數讀取 Key
    if not api_key:
        raise ValueError("未設定 OPENAI_API_KEY")  # 若無 Key 則報錯
    return OpenAI(api_key=api_key)  # 回傳 Client 物件

# --- [新增] 輔助函數：從解壓縮目錄取得 GIS 檔案名稱 ---
def get_gis_filenames(extract_path) -> List[str]:
    """
    掃描目錄，找出 .shp, .csv 等可用於 GIS 實作的檔案名稱
    這將用於提供給 AI，讓它知道有哪些素材可以出題
    """
    gis_exts = ('.shp', '.csv', '.tif', '.tiff', '.geojson', '.txt', '.json', '.kml')  # 定義感興趣的副檔名
    found_files = []  # 初始化結果列表
    for root, _, files in os.walk(extract_path):  # 遍歷目錄
        for filename in files:
            if filename.lower().endswith(gis_exts):  # 如果符合 GIS 格式
                found_files.append(filename)  # 加入列表
    return found_files  # 回傳檔名列表

# 定義根路徑 (Root Endpoint)
@app.get("/")
def home():
    # 回傳簡單的 JSON 訊息，確認伺服器正在運作，並告知可用的 API 路徑
    return {"message": "RAG Server Ready. Endpoints: /process_zip, /ask_with_zip, /api/generate_question, /api/grade_submission"}

# =========================================================
# 功能 1: 製作並下載 Vector DB (原始文件 -> RAG Zip)
# =========================================================
@app.post("/process_zip")
async def process_zip_file(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    """
    接收原始文件 Zip，製作成 FAISS 向量資料庫，並回傳 Zip 供使用者下載。
    """
    # 從環境變數取得 OpenAI API Key，這是呼叫 Embedding 模型必需的
    api_key = os.getenv("OPENAI_API_KEY")
    # 如果沒有設定 API Key，回傳 500 錯誤
    if not api_key:
        return JSONResponse(status_code=500, content={"error": "未設定 OPENAI_API_KEY"})

    # 產生一個唯一的 Task ID，用於隔離不同使用者的請求
    task_id = str(uuid.uuid4())
    # 定義檔案路徑
    zip_save_path = os.path.join(UPLOAD_DIR, f"{task_id}_{file.filename}")
    extract_folder = os.path.join(EXTRACT_DIR, task_id)
    vector_db_folder = os.path.join(OUTPUT_DIR, task_id)
    output_zip_path = os.path.join(OUTPUT_DIR, f"{task_id}_faiss.zip")

    # 將使用者上傳的 Zip 寫入硬碟
    with open(zip_save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # 1. 呼叫共通函數：解壓縮並讀取所有文件
        all_documents = process_zip_to_docs(zip_save_path, extract_folder)
        # 如果沒有讀取到任何支援的文件，回傳 400 錯誤
        if not all_documents:
            return JSONResponse(status_code=400, content={"error": "Zip 內無支援的文件"})

        # 2. 文字切分 (Chunking)
        # 設定切分器：每塊 1000 字元，重疊 200 字元
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        split_docs = text_splitter.split_documents(all_documents)

        # 3. 向量化 (Embedding)
        # 初始化 OpenAI Embeddings 模型 (使用 text-embedding-3-large)
        embeddings = OpenAIEmbeddings(model="text-embedding-3-large", api_key=api_key)
        # 使用 FAISS 將切分後的文件轉換為向量並建立索引
        vectorstore = FAISS.from_documents(split_docs, embeddings)

        # 4. 將向量資料庫存檔
        # 將 FAISS 索引儲存到本地資料夾 (包含 index.faiss 和 index.pkl)
        vectorstore.save_local(vector_db_folder)

        # 5. 打包成 Zip
        with zipfile.ZipFile(output_zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for root, dirs, files in os.walk(vector_db_folder):
                for file in files:
                    # 計算相對路徑，保持資料夾結構寫入 zip
                    arcname = os.path.relpath(os.path.join(root, file), os.path.join(vector_db_folder, '..'))
                    zipf.write(os.path.join(root, file), arcname)

        # 6. 設定背景清理任務 (刪除暫存檔)
        cleanup_targets_files = [zip_save_path, output_zip_path]
        cleanup_targets_dirs = [extract_folder, vector_db_folder]
        background_tasks.add_task(cleanup_files, cleanup_targets_files, cleanup_targets_dirs)

        # 回傳生成的 ZIP 檔給使用者下載
        return FileResponse(output_zip_path, filename=f"faiss_db_{task_id[:8]}.zip", media_type='application/zip')

    except Exception as e:
        # 發生錯誤時清理
        cleanup_files([zip_save_path], [extract_folder, vector_db_folder])
        return JSONResponse(status_code=500, content={"error": str(e)})


# =========================================================
# 功能 2: 上傳並直接問答 (支援 RAG Zip 或 原始文件 Zip)
# =========================================================
@app.post("/ask_with_zip")
async def ask_with_zip(
    background_tasks: BackgroundTasks, # 用於設定背景清理任務
    question: str = Form(...),         # 接收使用者輸入的問題 (Form Data)
    file: UploadFile = File(...)       # 接收使用者上傳的檔案 (Zip)
):
    """
    這是主要的問答 API。
    它會自動偵測上傳的 Zip 是「已經做好的 RAG 資料庫」還是「原始文件」。
    """
    # 取得 OpenAI API Key
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return JSONResponse(status_code=500, content={"error": "未設定 OPENAI_API_KEY"})

    # 產生唯一的 Task ID
    task_id = str(uuid.uuid4())
    # 設定檔案存放與解壓縮路徑
    zip_save_path = os.path.join(UPLOAD_DIR, f"{task_id}_{file.filename}")
    extract_folder = os.path.join(EXTRACT_DIR, task_id)

    # 儲存上傳的檔案
    with open(zip_save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # 驗證是否為 ZIP 格式
        if not zipfile.is_zipfile(zip_save_path):
             return JSONResponse(status_code=400, content={"error": "無效的 ZIP 檔"})

        # 先進行解壓縮，這樣我們才能檢查裡面的內容
        with zipfile.ZipFile(zip_save_path, 'r') as zip_ref:
            zip_ref.extractall(extract_folder)

        # === 關鍵邏輯：偵測是否為 RAG 資料庫 (FAISS) ===
        is_rag_db = False  # 預設不是 RAG DB
        db_folder = None   # 用來存放 index.faiss 所在的資料夾路徑
        
        # 遍歷解壓縮後的資料夾，尋找 FAISS 關鍵檔案
        for root, _, files in os.walk(extract_folder):
            # 如果資料夾內同時包含 index.faiss 和 index.pkl，判定為 RAG 資料庫
            if "index.faiss" in files and "index.pkl" in files:
                is_rag_db = True
                db_folder = root
                break  # 找到後就停止搜尋
        
        # 初始化 Embeddings 模型 (不管是哪種模式，都需要用它來處理問題向量)
        embeddings = OpenAIEmbeddings(model="text-embedding-3-large", api_key=api_key)

        # 根據偵測結果決定處理流程
        if is_rag_db:
            # 【模式 A】使用者上傳的是 RAG Zip (已做好的資料庫)
            print(f"偵測到 RAG 資料庫，載入路徑: {db_folder}")
            # 使用 FAISS.load_local 直接載入資料庫，速度極快
            # allow_dangerous_deserialization=True 是必須的，因為我們正在載入 pickle 檔
            vectorstore = FAISS.load_local(
                db_folder, 
                embeddings, 
                allow_dangerous_deserialization=True
            )
        else:
            # 【模式 B】使用者上傳的是 原始文件 Zip (PDF/Word 等)
            print("未偵測到資料庫，嘗試讀取原始文件...")
            # 呼叫之前的邏輯：讀取所有原始文件
            all_documents = process_zip_to_docs(zip_save_path, extract_folder)
            
            # 如果 Zip 裡既沒有 RAG DB，也沒有支援的原始文件，報錯
            if not all_documents:
                return JSONResponse(status_code=400, content={"error": "Zip 內無支援的文件 (亦非 RAG DB)"})

            # 進行切分 (Chunking)
            text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
            split_docs = text_splitter.split_documents(all_documents)
            # 現場製作向量資料庫 (In-Memory)
            vectorstore = FAISS.from_documents(split_docs, embeddings)

        # === 問答流程 (Retrieval & Generation) ===
        
        # 將向量庫轉換為檢索器 (Retriever)，設定搜尋最相關的 5 個片段 (k=5)
        retriever = vectorstore.as_retriever(search_kwargs={"k": 5})

        # 定義 Prompt Template (提示詞模板)，指導 AI 如何回答
        prompt_template = """你是一個專業的助教。請根據以下的上下文內容來回答學生的問題。

        上下文:
        {context}

        問題: {question}

        回答:"""

        # 建立 LangChain 的 Prompt 物件
        PROMPT = PromptTemplate(template=prompt_template, input_variables=["context", "question"])

        # 建立 RetrievalQA Chain (檢索問答鏈)
        qa_chain = RetrievalQA.from_chain_type(
            llm=ChatOpenAI(model="gpt-4o", temperature=0, api_key=api_key), # 使用 GPT-4o 模型
            chain_type="stuff", # "stuff" 模式：把所有檢索到的內容塞進 Prompt
            retriever=retriever, # 使用剛剛設定的檢索器
            chain_type_kwargs={"prompt": PROMPT}, # 傳入自訂的 Prompt
            return_source_documents=True # 要求回傳參考的來源文件，方便顯示出處
        )

        # 執行問答鏈，傳入使用者的問題
        result = qa_chain.invoke({"query": question})

        # === 清理與回傳 ===
        # 設定背景任務，刪除剛剛上傳和解壓縮的暫存檔
        cleanup_targets_files = [zip_save_path]
        cleanup_targets_dirs = [extract_folder]
        background_tasks.add_task(cleanup_files, cleanup_targets_files, cleanup_targets_dirs)

        # 回傳 JSON 結果
        return {
            "question": question, # 回傳原始問題
            "answer": result["result"], # 回傳 AI 的回答
            # 回傳參考資料來源 (去重複)，如果有 metadata 則顯示檔名，否則顯示 unknown
            "sources": list(set([doc.metadata.get('filename', 'unknown') for doc in result.get("source_documents", [])]))
        }

    except Exception as e:
        # 如果發生任何未預期的錯誤，也要清理暫存檔
        cleanup_files([zip_save_path], [extract_folder])
        # 回傳 500 錯誤與詳細錯誤訊息
        return JSONResponse(status_code=500, content={"error": str(e)})


# =========================================================
# [新增] API 3: 智慧出題 (Generate Question)
# 邏輯：優先使用上傳的檔案，若無則使用伺服器上的 'rag_db.zip'
# =========================================================
@app.post("/api/generate_question")
async def generate_practice_question_with_upload(
    background_tasks: BackgroundTasks, # 用於設定背景清理任務
    file: Optional[UploadFile] = File(None), # [關鍵修改] 檔案為可選 (Optional)，預設為 None
    qtype: str = Form(...),            # 使用 Form Data 接收題型
    level: str = Form(...)             # 使用 Form Data 接收難度
):
    """
    【一條龍出題 API】
    1. 檢查是否有上傳 ZIP，若有則使用。
    2. 若無上傳，檢查伺服器同層目錄下是否有 'rag_db.zip'，若有則使用。
    3. 自動載入向量資料庫 -> 檢索 Context -> 偵測檔案列表 -> 呼叫 GPT-4o 生成題目。
    """
    # 檢查 API Key
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key: return JSONResponse(status_code=500, content={"error": "未設定 OPENAI_API_KEY"})
    
    # 初始化 OpenAI 原生客戶端
    client = get_openai_client()
    
    # 建立任務 ID 與路徑
    task_id = str(uuid.uuid4())
    extract_folder = os.path.join(EXTRACT_DIR, task_id)

    # === [關鍵邏輯] 決定使用哪個 ZIP 檔案來源 ===
    zip_source_path = "" # 用來存放最終要解壓縮的檔案路徑
    
    if file:
        # 情境 A: 使用者有上傳檔案
        print(f"收到使用者上傳檔案: {file.filename}")
        zip_source_path = os.path.join(UPLOAD_DIR, f"{task_id}_{file.filename}")
        with open(zip_source_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer) # 將上傳的內容寫入硬碟
    else:
        # 情境 B: 使用者沒上傳，檢查伺服器預設檔案
        default_zip = "rag_db.zip" # 預設檔案名稱
        if os.path.exists(default_zip):
            print(f"使用伺服器預設檔案: {default_zip}")
            # 複製一份到 upload 資料夾，避免多執行緒同時讀寫同一個檔案造成衝突
            zip_source_path = os.path.join(UPLOAD_DIR, f"{task_id}_default.zip")
            shutil.copy(default_zip, zip_source_path)
        else:
            # 兩者皆無，回傳錯誤
            return JSONResponse(status_code=400, content={"error": "未上傳檔案，且伺服器找不到預設的 rag_db.zip"})

    try:
        # 驗證 ZIP 格式
        if not zipfile.is_zipfile(zip_source_path):
             return JSONResponse(status_code=400, content={"error": "無效的 ZIP 檔"})

        # 2. 解壓縮
        with zipfile.ZipFile(zip_source_path, 'r') as zip_ref:
            zip_ref.extractall(extract_folder)

        # 3. 偵測 ZIP 內容：是「已經做好的 FAISS DB」還是「原始文件」？
        is_rag_db = False
        db_folder = None
        for root, _, files in os.walk(extract_folder):
            # 檢查是否有 FAISS 的索引檔案
            if "index.faiss" in files and "index.pkl" in files:
                is_rag_db = True
                db_folder = root
                break
        
        embeddings = OpenAIEmbeddings(model="text-embedding-3-large", api_key=api_key)

        # 4. 準備 VectorStore (載入或現場製作)
        if is_rag_db:
            # 情況 A: 是處理過的 rag.zip -> 直接載入，速度快
            vectorstore = FAISS.load_local(db_folder, embeddings, allow_dangerous_deserialization=True)
        else:
            # 情況 B: 是原始文件 Zip -> 現場切分向量化 (較慢)
            all_documents = process_zip_to_docs(zip_source_path, extract_folder)
            if not all_documents:
                return JSONResponse(status_code=400, content={"error": "Zip 內無支援的講義文件"})
            text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
            split_docs = text_splitter.split_documents(all_documents)
            vectorstore = FAISS.from_documents(split_docs, embeddings)

        # 5. 自動偵測檔案列表 (File List) - 讓 AI 知道有哪些 GIS 檔案可用
        # 使用輔助函數掃描解壓縮目錄
        file_names = get_gis_filenames(extract_folder)
        file_names_str = ", ".join(file_names) if file_names else "None"

        # 6. RAG 檢索 (Retrieval) - 找出與「題型/難度」相關的內容
        query = f"空間分析 {level} {qtype} 重點概念與操作步驟"
        retriever = vectorstore.as_retriever(search_kwargs={"k": 5}) # 撈前 5 個相關段落
        docs = retriever.invoke(query)
        context_text = "\n\n".join([d.page_content for d in docs]) # 組合 Context 文字

        # 7. 組合 Prompt (System Prompt) - 嚴格限制 AI 行為
        sys_role = "你是頂尖的空間分析助教。請使用 GPT-4o 的強大邏輯來出題。"
        r_rules = """⚠️ 嚴格限制：
1. 實作內容必須限定使用 **R 語言** (例如使用 sf, terra, tmap, tidyverse 等套件)。
2. 🚫 禁止提及 "ArcGIS", "QGIS" 或通用的 "GIS 軟體" 字眼。
3. 題目應引導學生寫出 R 程式碼來解決問題。
4. **請務必使用繁體中文 (Traditional Chinese) 出題。**"""
        
        system_instruction = f"""你必須從提供的「真實檔案列表」中選擇一個檔案來設計操作任務。
真實檔案列表: [{file_names_str}]
(若選擇 Shapefile，請只提及 .shp 檔，不要提及 .dbf 或 .shx)
{r_rules}
【出題重要規範】
1. 在 'question_content' (題目) 中：只說明**任務目標**與**使用資料**。❌ 嚴禁直接列出步驟 1, 2, 3。請保留思考空間給學生。
2. 在 'hint' (提示) 中：才列出詳細的解題步驟、建議使用的 R 套件與函數。"""

        task_instruction = f"目前的題型任務是：【{qtype}】。難度：{level}。"
        core_point = f"🔥 **本次題目核心考點：請根據以下參考講義內容設計**"

        final_system_prompt = f"""
{sys_role}
{task_instruction}
{core_point}
(Please design the question around the core concept above.)
{system_instruction}
請以 JSON 格式回傳：
{{ "question_content": "Question content (Markdown)...", "hint": "Hint for students...", "target_filename": "AI選擇的檔案名稱" }}
"""
        user_prompt_text = f"參考講義內容：\n{context_text}"

        # 8. 呼叫 GPT-4o 生成題目
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": final_system_prompt}, 
                {"role": "user", "content": user_prompt_text}
            ],
            response_format={"type": "json_object"}, # 強制回傳 JSON
            temperature=0.7 # 保持一點創造力
        )
        
        # 設定背景清理任務 (刪除暫存檔，包含複製出來的 zip 和解壓資料夾)
        background_tasks.add_task(cleanup_files, [zip_source_path], [extract_folder])
        
        # 回傳生成的 JSON
        return json.loads(response.choices[0].message.content)

    except Exception as e:
        # 發生錯誤時清理
        cleanup_files([zip_source_path], [extract_folder])
        return JSONResponse(status_code=500, content={"error": str(e)})


# =========================================================
# [新增] API 4: 智慧評分 (Grade Submission)
# 邏輯：優先使用上傳的檔案，若無則使用伺服器上的 'rag_db.zip'
# =========================================================
@app.post("/api/grade_submission")
async def grade_submission_with_upload(
    background_tasks: BackgroundTasks,
    file: Optional[UploadFile] = File(None), # [關鍵修改] 檔案為可選 (Optional)
    question_text: str = Form(...),    # 題目內容
    student_answer: str = Form(...),   # 學生回答
    qtype: str = Form(...)             # 題型
):
    """
    【評分 API】
    1. 依據上傳或預設的 ZIP 準備評分標準庫。
    2. 根據「題目內容」檢索相關講義 (Context)。
    3. 呼叫 GPT-4o 進行評分。
    """
    # 檢查 API Key
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key: return JSONResponse(status_code=500, content={"error": "未設定 OPENAI_API_KEY"})

    client = get_openai_client()
    task_id = str(uuid.uuid4())
    extract_folder = os.path.join(EXTRACT_DIR, task_id)

    # === [關鍵邏輯] 決定使用哪個 ZIP 檔案來源 ===
    zip_source_path = ""
    
    if file:
        print(f"收到使用者上傳評分參考檔: {file.filename}")
        zip_source_path = os.path.join(UPLOAD_DIR, f"{task_id}_{file.filename}")
        with open(zip_source_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    else:
        default_zip = "rag_db.zip"
        if os.path.exists(default_zip):
            print(f"使用伺服器預設檔案評分: {default_zip}")
            zip_source_path = os.path.join(UPLOAD_DIR, f"{task_id}_default.zip")
            shutil.copy(default_zip, zip_source_path) # 複製一份，確保執行緒安全
        else:
            return JSONResponse(status_code=400, content={"error": "未上傳檔案，且伺服器找不到預設的 rag_db.zip"})

    try:
        if not zipfile.is_zipfile(zip_source_path):
             return JSONResponse(status_code=400, content={"error": "無效的 ZIP 檔"})

        # 2. 解壓縮
        with zipfile.ZipFile(zip_source_path, 'r') as zip_ref:
            zip_ref.extractall(extract_folder)

        # 3. 偵測並載入向量資料庫
        is_rag_db = False
        db_folder = None
        for root, _, files in os.walk(extract_folder):
            if "index.faiss" in files and "index.pkl" in files:
                is_rag_db = True
                db_folder = root
                break
        
        embeddings = OpenAIEmbeddings(model="text-embedding-3-large", api_key=api_key)

        if is_rag_db:
            vectorstore = FAISS.load_local(db_folder, embeddings, allow_dangerous_deserialization=True)
        else:
            all_documents = process_zip_to_docs(zip_source_path, extract_folder)
            if not all_documents:
                return JSONResponse(status_code=400, content={"error": "Zip 內無支援的講義文件"})
            text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
            split_docs = text_splitter.split_documents(all_documents)
            vectorstore = FAISS.from_documents(split_docs, embeddings)

        # 4. RAG 檢索 (Retrieval) - 用「題目」去撈出「標準答案/相關概念」作為評分依據 (Context)
        # 這樣 AI 才能根據講義內容評分，而不只是根據通用知識
        query = question_text
        retriever = vectorstore.as_retriever(search_kwargs={"k": 5})
        docs = retriever.invoke(query)
        context_text = "\n\n".join([d.page_content for d in docs])

        # 5. 判斷題型並設定 Prompt
        is_conceptual = any(k in qtype for k in ["簡答", "Short Answer", "Intro"])
        
        if is_conceptual:
            # 情境 A：觀念簡答題 Prompt
            prompt = f"""你是一位空間分析助教。請批改這道**「觀念簡答題」**。
目標：評估學生對 GIS 原理的理解、邏輯推演與解釋清晰度。
【重要限制】
1. **請務必使用繁體中文 (Traditional Chinese) 撰寫所有評語、優點、弱點與行動建議。**
2. 若參考資料為英文，請自行翻譯並內化成中文回饋。
【評分標準】A) 概念正確性 (3分), B) 邏輯與解釋 (4分), C) 完整性 (3分)。
【輸出 JSON】{{ "score": int, "level": str, "rubric": [], "strengths": [], "weaknesses": [], "missing_items": [], "action_items": [] }}
[題目] {question_text}
[學生回答] {student_answer}
[講義依據] {context_text}"""
        else:
            # 情境 B：實作題 Prompt (預設)
            prompt = f"""你是一位空間分析助教。請批改這道**「R 語言實作題」**。
目標：評估 R 程式碼的正確性、可重現性與空間邏輯。
【重要限制】
1. **請務必使用繁體中文 (Traditional Chinese) 撰寫所有評語、優點、弱點與行動建議。**
2. 若參考資料為英文，請自行翻譯並內化成中文回饋。
【評分標準】A) 需求覆蓋 (3分), B) 空間邏輯 (4分), C) R 程式嚴謹度 (3分)。
【輸出 JSON】{{ "score": int, "level": str, "rubric": [], "strengths": [], "weaknesses": [], "missing_items": [], "action_items": [] }}
[題目] {question_text}
[學生回答] {student_answer}
[講義依據] {context_text}"""

        # 6. 呼叫 OpenAI 進行評分
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.3 # 評分建議使用低溫度，保持客觀一致
        )
        
        # 設定背景清理任務
        background_tasks.add_task(cleanup_files, [zip_source_path], [extract_folder])
        
        # 回傳 JSON 結果
        return json.loads(response.choices[0].message.content)

    except Exception as e:
        # 發生錯誤時清理
        cleanup_files([zip_source_path], [extract_folder])
        return JSONResponse(status_code=500, content={"error": str(e)})