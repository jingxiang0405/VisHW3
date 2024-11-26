import pandas as pd
import os


def extract_table(file_path, keyword="金融機構名稱", valid_row_keyword="銀行"):
    # 讀取整個檔案
    data = pd.read_excel(file_path, engine="odf", header=None)
    # 搜尋關鍵字所在的行
    header_index = None
    for index, row in data.iterrows():
        # print(row)
        for val in row.values:
            if isinstance(val, str) and keyword in val:
                header_index = index
                break

    # 如果找不到「金融機構名稱」，提示用戶
    if header_index is None:
        raise ValueError(f"未找到標題 '{keyword}'，請確認檔案內容。")

    # 從 header_index 往下檢查，直到找到包含有效數據的行
    data_start_index = None
    for index in range(header_index + 1, len(data)):
        row = data.iloc[index]
        if row.apply(lambda x: isinstance(x, str) and valid_row_keyword in x).any():
            data_start_index = index
            break

    # 如果找不到包含有效數據的行，提示用戶
    if data_start_index is None:
        return
        raise ValueError(
            f"在 '{keyword}' 行之後未找到包含 '{valid_row_keyword}' 的數據行，請確認檔案內容。"
        )

    # 將標題行設為表格的 header，並提取有效數據部分
    header = data.iloc[header_index].fillna("")
    table = data.iloc[data_start_index:]
    table.columns = header  # 設置標題
    table = table.reset_index(drop=True)  # 重設索引

    # 移除底部非數據內容
    def is_non_data_row(row):
        # 判斷該行是否包含空值（即存在非數據內容）
        return row.isna().any()

    # 找到最後一行有效數據的位置
    last_valid_index = len(table) - 1
    for index in range(len(table) - 1, -1, -1):
        if not is_non_data_row(table.iloc[index]):
            last_valid_index = index
            break

    # 保留有效數據
    table = table.iloc[: last_valid_index + 1]

    table = table[
        ~table.apply(lambda row: row.astype(
            str).str.contains("總計").any(), axis=1)
    ]

    table.columns = table.columns.str.strip()

    return table


# Apply the function to your file
file_path = "data/ods_files/"
files = os.listdir(file_path)
os.chdir(file_path)
for file in files:
    if not file.endswith("ods"):
        continue
    if file.startswith("~"):
        continue
    print(f"Processing {file}...", end=" ")
    table = extract_table(file)
    output_path = f"../csv/{file[:-3]}csv"
    print("Done.")
    table.to_csv(output_path, index=False)

# Save the extracted table to a new file for inspection
