from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: str
    FRONTEND_URL: str

    model_config = SettingsConfigDict(env_file=".env", extra="ignore") # Load from .env

settings = Settings()