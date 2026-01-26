"""Models package"""

from .image_classifier import ImageClassifier
from . import meta  # ensure migration/test table exists for tests

__all__ = ['ImageClassifier', 'meta']