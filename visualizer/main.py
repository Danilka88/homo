# visualizer/main.py

import os
from agent import generate_room_description

# --- Константы ---
ASSETS_DIR = 'assets'
RESULT_FILE = 'result.md'

def main():
    """
    Главный скрипт для запуска процесса генерации.
    """
    print("--- Запуск модуля Visualizer ---")
    
    # 1. Определяем пути
    script_dir = os.path.dirname(__file__)
    assets_path = os.path.join(script_dir, ASSETS_DIR)
    result_path = os.path.join(script_dir, RESULT_FILE)

    # 2. Сканируем папку assets на наличие .png файлов
    if not os.path.exists(assets_path):
        print(f"Ошибка: Директория для ассетов не найдена по пути: {assets_path}")
        return
        
    asset_files = [
        os.path.join(assets_path, f) 
        for f in os.listdir(assets_path) 
        if f.endswith('.png')
    ]

    if not asset_files:
        print(f"Внимание: В директории '{assets_path}' не найдено ни одного файла с расширением .png.")
        print("Пожалуйста, добавьте файлы ассетов (wallpaper.png, floor.png и т.д.).")
        # Все равно запускаем агент, чтобы он сообщил об ошибке в result.md
    else:
        print(f"Найдено ассетов: {len(asset_files)}")
        for asset in asset_files:
            print(f"  - {os.path.basename(asset)}")

    # 3. Вызов агента для генерации описания
    markdown_result = generate_room_description(asset_files)

    # 4. Запись результата в файл result.md
    try:
        with open(result_path, 'w', encoding='utf-8') as f:
            f.write(markdown_result)
        print(f"\n✅ Процесс завершен. Результат сохранен в файл: {result_path}")
    except IOError as e:
        print(f"\n❌ Ошибка при записи результата в файл: {e}")

if __name__ == '__main__':
    main()
