import pandas as pd
import os

# Load your data (replace 'your_file.csv' with the actual file name if loading from a file)
file_path = "data/csv/"
files = os.listdir(file_path)
os.chdir(file_path)
for file in files:
    if file.startswith("~"):
        continue
    print(f"Processing {file}...", end=" ")
    df = pd.read_csv(file, index_col="金融機構名稱")

    df_filtered = df[["當月發卡數"]]
    output_path = f"../final/{file[:-3]}csv"
    df_filtered.to_csv(output_path)
    print("Done.")
