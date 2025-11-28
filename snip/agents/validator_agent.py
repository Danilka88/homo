# snip/agents/validator_agent.py

from langchain_community.chat_models import ChatOllama
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate

# --- Константы ---
OLLAMA_MODEL = "gemma3:27b"

# --- Системный промпт ---
SYSTEM_PROMPT = """
Ты — ведущий эксперт по жилищному законодательству и строительным нормам РФ (СНиП). 
Твоя задача — провести аудит плана перепланировки на основе предоставленных правил.

Внимательно изучи следующий набор правил:
--- ПРАВИЛА ---
{rules}
--- КОНЕЦ ПРАВИЛ ---

Теперь проанализируй план работ, который предоставил пользователь:
--- ПЛАН РАБОТ ---
{document}
--- КОНЕЦ ПЛАНА РАБОТ ---

Твои действия:
1.  Найди все пункты в плане работ, которые противоречат предоставленным правилам.
2.  Для каждого найденного нарушения четко укажи, какой пункт плана нарушает какой пункт правил, и почему это является нарушением.
3.  Если нарушений нет, четко и ясно напиши: "Нарушений не найдено".
4.  Структурируй свой ответ в виде списка нарушений.
"""

def run_validation_agent(rules_content: str, document_content: str) -> str:
    """
    Запускает одного агента для валидации документа по правилам.

    Args:
        rules_content: Содержимое файла с правилами (СНиП.md).
        document_content: Содержимое файла с планом работ (doc.md).

    Returns:
        Результат анализа от LLM.
    """
    try:
        # 1. Инициализация модели
        # Температура 0.1 для более предсказуемых и последовательных ответов
        llm = ChatOllama(model=OLLAMA_MODEL, temperature=0.1)

        # 2. Создание шаблона промпта
        prompt = ChatPromptTemplate.from_template(SYSTEM_PROMPT)

        # 3. Создание и запуск цепочки
        chain = prompt | llm | StrOutputParser()

        print(f"Агент (PID: {__import__('os').getpid()}) начал анализ...")

        # 4. Вызов цепочки с передачей контента
        result = chain.invoke({
            "rules": rules_content,
            "document": document_content
        })

        print(f"Агент (PID: {__import__('os').getpid()}) завершил анализ.")
        
        return result

    except Exception as e:
        error_message = f"Ошибка в работе агента (PID: {__import__('os').getpid()}): {e}"
        print(error_message)
        # Проверяем, связана ли ошибка с подключением к Ollama
        if "connection refused" in str(e).lower():
            return (
                f"{error_message}\n\n"
                "**ПОДСКАЗКА:** Убедитесь, что сервер Ollama запущен и модель 'gemma3:27b' доступна. "
                "Проверьте `llm/README.md` для инструкций по запуску."
            )
        return error_message

if __name__ == '__main__':
    # Пример прямого запуска для отладки
    print("Запуск агента в режиме отладки...")

    # Чтение тестовых файлов
    try:
        with open('../SNiP.md', 'r', encoding='utf-8') as f:
            rules = f.read()
        with open('../doc.md', 'r', encoding='utf-8') as f:
            doc = f.read()

        # Запуск анализа
        validation_result = run_validation_agent(rules, doc)
        
        # Вывод результата
        print("\n--- РЕЗУЛЬТАТ АНАЛИЗА ---\n")
        print(validation_result)

    except FileNotFoundError:
        print("Ошибка: Не найдены файлы `SNiP.md` или `doc.md` в родительской директории.")
        print("Запустите этот скрипт из директории `snip/agents/` для отладки.")

