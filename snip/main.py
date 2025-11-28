# snip/main.py

import multiprocessing
import os
from agents.validator_agent import run_validation_agent

# --- Константы ---
NUM_AGENTS = 10
RULES_FILE = 'SNiP.md'
DOC_FILE = 'doc.md'

def main():
    """
    Главная функция для запуска процесса валидации.
    """
    print("--- Запуск системы валидации проекта ---")
    
    # 1. Определение путей к файлам
    script_dir = os.path.dirname(__file__)
    rules_path = os.path.join(script_dir, RULES_FILE)
    doc_path = os.path.join(script_dir, DOC_FILE)

    # 2. Чтение содержимого файлов
    try:
        with open(rules_path, 'r', encoding='utf-8') as f:
            rules_content = f.read()
        with open(doc_path, 'r', encoding='utf-8') as f:
            document_content = f.read()
        print("База знаний (SNiP.md) и документ (doc.md) успешно загружены.")
    except FileNotFoundError as e:
        print(f"Ошибка: Не удалось найти необходимый файл: {e.filename}")
        print("Убедитесь, что SNiP.md и doc.md находятся в той же директории, что и main.py")
        return

    # 3. Подготовка аргументов для каждого агента
    # Все агенты получают одинаковые данные для анализа
    agent_tasks = [(rules_content, document_content)] * NUM_AGENTS

    # 4. Запуск пула процессов
    print(f"\nЗапускаю {NUM_AGENTS} ИИ-агентов для параллельного анализа. Это может занять некоторое время...")
    
    # Создаем пул из NUM_AGENTS процессов
    with multiprocessing.Pool(processes=NUM_AGENTS) as pool:
        # Используем starmap для передачи нескольких аргументов в функцию
        results = pool.starmap(run_validation_agent, agent_tasks)

    # 5. Вывод результатов
    print("\n--- ВСЕ АГЕНТЫ ЗАВЕРШИЛИ РАБОТУ. РЕЗУЛЬТАТЫ: ---\\n")
    
    for i, result in enumerate(results):
        print(f"=============== ОТВЕТ АГЕНТА #{i + 1} ===============\n")
        print(result)
        print(f"\n============= КОНЕЦ ОТВЕТА АГЕНТА #{i + 1} ============\n")
        print("-" * 60 + "\n")

if __name__ == '__main__':
    # Устанавливаем метод запуска 'spawn' для совместимости с macOS и Windows
    multiprocessing.set_start_method('spawn', force=True)
    main()
