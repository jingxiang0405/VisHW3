import os


def rename_files_in_directory(directory):
    try:
        # List all files in the directory
        for filename in os.listdir(directory):
            # Create the full file path
            old_file_path = os.path.join(directory, filename)

            # Skip directories
            if os.path.isdir(old_file_path):
                continue

            # Generate new file name (first 5 characters of the current name)
            new_name = filename[:5]

            # Ensure the new name retains the original file extension
            file_extension = os.path.splitext(filename)[1]
            new_file_path = os.path.join(directory, new_name + file_extension)

            # Rename the file
            os.rename(old_file_path, new_file_path)
            print(f"Renamed: {filename} -> {new_name + file_extension}")

    except Exception as e:
        print(f"An error occurred: {e}")


# Example usage
directory_path = "data"  # Replace with your directory path
rename_files_in_directory(directory_path)
