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

    assert test_source("ASV IS 759-781", "ASV IS 759). P") == True
    assert test_source("HMC Stuart", "HMC/Stuart, 5") == True
    assert test_source("Voltaire 1967", "1 Voltaire 1967, no.88. 2.") == True
    assert test_source("Gazz.Tosc.", "on 1 March 1767 (Gazz.Tosc.).") == True
    print(list(generate_source_regexes("Thomas letters MSS")))
    assert test_source("Thomas letters MSS", "1. Thomas letters MSS, f.27 (30 Nov. 1750). 2. Constable, Wilson, 22.") == True