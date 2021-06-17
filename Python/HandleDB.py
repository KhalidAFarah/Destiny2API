import requests, zipfile, os, pickle, json, sqlite3

hashes = {
    #'DestinyActivityDefinition': 'activityHash',
    #'DestinyActivityTypeDefinition': 'activityTypeHash',
    #'DestinyClassDefinition': 'classHash',
    #'DestinyGenderDefinition': 'genderHash',
    #'DestinyInventoryBucketDefinition': 'bucketHash',
    'DestinyInventoryItemDefinition': 'itemHash',
    #'DestinyProgressionDefinition': 'progressionHash',
    #'DestinyRaceDefinition': 'raceHash',
    #'DestinyTalentGridDefinition': 'gridHash',
    #'DestinyUnlockFlagDefinition': 'flagHash',
    #'DestinyHistoricalStatsDefinition': 'statId',
    #'DestinyDirectorBookDefinition': 'bookHash',
    'DestinyStatDefinition': 'statHash',
    'DestinySandboxPerkDefinition': 'perkHash',
    #'DestinyDestinationDefinition': 'destinationHash',
    #'DestinyPlaceDefinition': 'placeHash',
    #'DestinyActivityBundleDefinition': 'bundleHash',
    #'DestinyStatGroupDefinition': 'statGroupHash',
    #'DestinySpecialEventDefinition': 'eventHash',
    #'DestinyFactionDefinition': 'factionHash',
    #'DestinyVendorCategoryDefinition': 'categoryHash',
    #'DestinyEnemyRaceDefinition': 'raceHash',
    #'DestinyScriptedSkullDefinition': 'skullHash',
    #'DestinyGrimoireCardDefinition': 'cardId'
}

hashes_trunc = {
    'DestinyInventoryItemDefinition': 'itemHash',
    'DestinyTalentGridDefinition': 'gridHash',
    'DestinyHistoricalStatsDefinition': 'statId',
    'DestinyStatDefinition': 'statHash',
    'DestinySandboxPerkDefinition': 'perkHash',
    'DestinyStatGroupDefinition': 'statGroupHash'
}

def get_manifest():

    if os.path.exists("manifest.content"):
        os.remove("manifest.content")
    if os.path.exists("manifest.pickle"):
        os.remove("manifest.pickle")
    if os.path.exists("MANZIP"):
        os.remove("MANZIP")
        
    manifest_url = 'http://www.bungie.net/Platform/Destiny2/Manifest/'
    HEADERS = {"X-API-Key":"a8d4879a0fe04169aa7c7b782265f964"}

    r = requests.get(manifest_url, headers=HEADERS)
    manifest = r.json()
    mani_url = 'http://www.bungie.net'+manifest['Response']['mobileWorldContentPaths']['en']

    r = requests.get(mani_url, headers=HEADERS)
    with open("MANZIP", "wb") as zip:
        zip.write(r.content)
    

    with zipfile.ZipFile('MANZIP') as zip:
        name = zip.namelist()
        zip.extractall()
    os.rename(name[0], 'manifest.content')
    

    con = sqlite3.connect('manifest.content')
    cur = con.cursor()

    all_data = {}
    for table_name in hashes.keys():
        
    
        cur.execute('SELECT json from '+table_name)
        items = cur.fetchall()
        item_jsons = [json.loads(item[0]) for item in items]

        item_dict = {}
        hash = hashes[table_name]
        fs = False
        for item in item_jsons:
            item_dict[item['hash']] = item

        all_data[table_name] = item_dict

    file = open("manifest.pickle", "wb")
    file.close()

    with open("manifest.pickle", "wb") as data:
        pickle.dump(all_data, data)

get_manifest()