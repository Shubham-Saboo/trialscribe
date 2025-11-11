"""
Logging configuration for TrialScribe
"""
import logging
import sys
from typing import Optional

# Configure root logger
logger = logging.getLogger("trialscribe")
logger.setLevel(logging.INFO)

# Create console handler if it doesn't exist
if not logger.handlers:
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(logging.INFO)
    
    # Create formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)


def get_logger(name: Optional[str] = None) -> logging.Logger:
    """
    Get a logger instance
    
    Args:
        name: Optional logger name (defaults to 'trialscribe')
        
    Returns:
        Logger instance
    """
    if name:
        return logging.getLogger(f"trialscribe.{name}")
    return logger

