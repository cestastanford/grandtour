import re
from pymongo import MongoClient

client = MongoClient()

db = client.test
coll = db.entries



test_strings = ['1. Brown 1135. 2. Sharpe jnl.MSS (23 Aug. 1701).',

 '1 Voltaire, no.88. 2. Dance letters MSS (N. Dance, 6 Feb. 1763). 3. F. Russell, CL, 14 Jun. 1973, 1754. Clark/Bowron, p.375, as unverified. 4. Seafield MSS, GD248 49/2 (D. Crespin, 11 Mar. 1763). 5. Kaye letters MSS (4 Sep. 1763). 6.Morgan Jnl., 198. 7. Holroyd letters MSS (7 Feb. 1765). AVR SA, S.Lorenzo in Lucina. 8. Farington jnl. MSS (1 Apr., 24-6 May 1765). 9. Gibbon, Misc.Works, 1:200. 10. Miller, Letters, 1:52. 11. R.C. Hoare, Recollections Abroad 1785-7, 17-18. See Dutens, Memoirs, 1:226-8.',

"1. Acland's uncle's acct.bk.; Somerset RO, DD/AH 21/3. 2. Gazz.Tosc., 14 Feb. 1767. 3. ASV IS 759 (noted as 1766 inRBF, evidently in error).",

'1. W.H. Smith, Originals Abroad, 97-125. 2. Wal.Corr., 20:472-3, 480. 3. Gibbon, Journey, 230, and Letters, 1:183.',

'1. Wal.Corr., 5:23, 356-8, 369-71, 384. 2. [J.W. Newman], Memoirs of the Life of Robert Adair, 37. See Montaiglon, 13:122, and Wal.Corr., 5:24, 129. 3. See Wal.Corr., 24:314-26; 36:138-49. 4. ASV IS 760. 5. Newman (at n2), 36-7. T.A.Malloch, Bull. of the New York Acad. of Medicine, 2nd ser., 13[1937]:576-96. 6. Michaelis, 103.']



def noteParser(s, path_of_log_file, ID):
    def log_to_file(text, path, ID):
        with open(path, "a") as myfile:
            myfile.write(str(ID))
            myfile.write("\n")
            myfile.write(text)
            myfile.write("\n")

    if s is None:
        return []
    s = s.strip()
    if len(s) <= 1:
        return []
    if s[1] == " ":
        s = s[0] + "." + s[1:]
    s_copy = s
    # print(s_copy)
    references_parsed = []
    index = 1
    while True:
        # print(index)
        # 1\.* (.+) 2\.
        r_str = str(index) + "\. (.+) " + str(index + 1) + "\."
        reg = re.compile(r_str)
        
        m = reg.search(s_copy)
        
        # both a valid citation and no match, it is on final match, so change regex
        if not m:
            r_str = str(index) + "\. (.+)"
            # print(r_str)
            reg = re.compile(r_str)
            m = reg.search(s_copy)
            # print(m)
            # print(s_copy)
            # print(m.group(1))
            try:
                references_parsed.append(m.group(1).strip())
        
            except AttributeError as e:
                log_to_file(s, path_of_log_file, ID)
                return None
            break
        index += 1
        try:
            references_parsed.append(m.group(1).strip())
        
        except AttributeError as e:
            log_to_file(s, path_of_log_file, ID)
            return []
        _, end = m.span(1)
        s_copy = s_copy[end:].strip()
        # print(s_copy)


    return references_parsed

def editEachField(coll, path):
    for doc in coll.find():
        entries = noteParser(doc['notes'], path, doc['_id'])

        
        coll.update(
        {'_id': doc['_id']},
        {'$set': {'notes_parsed': entries} }, upsert=False, multi=False)

        
    

editEachField(coll, "./issues.txt")
print("FINISHED")
# for s in test_strings:
#     print(noteParser(s, "./issues.txt"))
