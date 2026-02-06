# 使用 Python 3.10 避免部分套件在 3.11 的相容性問題
FROM python:3.10

WORKDIR /code

# 複製 requirements.txt 並安裝
# 增加 --no-cache-dir 確保不使用舊的快取
COPY ./requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# 設定使用者 (Hugging Face 安全規範)
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

# 設定工作目錄與複製程式碼
WORKDIR $HOME/app
COPY --chown=user . $HOME/app

# 啟動 Server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]