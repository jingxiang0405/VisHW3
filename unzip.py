import os
import zipfile

# Path to the directory containing zip files
zip_folder = "data"

# Iterate through all zip files in the directory
for file in os.listdir(zip_folder):
    if file.endswith(".zip"):
        zip_path = os.path.join(zip_folder, file)

        # Open the zip file
        with zipfile.ZipFile(zip_path, "r") as zip_ref:
            # List all files in the archive
            for contained_file in zip_ref.namelist():
                # Check if the file is an .ods file
                if contained_file.endswith(".ods"):
                    print(f"Extracting {contained_file} from {file}...")
                    # Extract the .ods file to the same folder as the zip file
                    zip_ref.extract(contained_file, zip_folder)
                    # Move the extracted file to the main folder, not inside a subdirectory
                    extracted_path = os.path.join(zip_folder, contained_file)
                    os.rename(
                        extracted_path,
                        os.path.join(
                            zip_folder, os.path.basename(contained_file)),
                    )
