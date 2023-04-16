import re
from source_updater_master import generate_source_regexes

def test_generate_source_regexes():
    test_source = lambda source_str, test_str: any(r.search(test_str) for r in generate_source_regexes(source_str))
    # Match entire word
    assert test_source("98/1-3", "98/1-3") == True
    assert test_source("BG", "BG 123") == True

    # Don't match if not entire word
    assert test_source("BG", "BG123") == False

    # Match items within range
    assert test_source("98/1-3", "98/1") == True
    assert test_source("98/1-3", "98/2") == True
    assert test_source("98/1-3", "98/3") == True
    assert test_source("98/1-3", "98/4") == False

    # Escape
    assert test_source("h+++ello", "h+++ello") == True