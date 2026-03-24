"""Minimal ConversationBufferMemory compatible with LangChain-style APIs."""


class ConversationBufferMemory:
    """Stores chat turns and exposes load_memory_variables like LangChain."""

    def __init__(self, memory_key: str = "chat_history", return_messages: bool = True):
        self.memory_key = memory_key
        self.return_messages = return_messages
        self.chat_memory = self._ChatMemory()

    class _ChatMemory:
        def __init__(self):
            self.messages: list[tuple[str, str]] = []

        def add_user_message(self, content: str) -> None:
            self.messages.append(("user", content))

        def add_ai_message(self, content: str) -> None:
            self.messages.append(("assistant", content))

    def load_memory_variables(self, _: dict) -> dict[str, str]:
        text = "\n".join(f"{role}: {content}" for role, content in self.chat_memory.messages)
        return {self.memory_key: text}
