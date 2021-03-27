import requests
import json
import pickle
from flask import Flask, render_template, url_for, jsonify
import sqlite3

app = Flask(__name__)

def sendRequest(URL):
    HEADERS = {"X-API-Key":"a8d4879a0fe04169aa7c7b782265f964"}
    response = requests.get(URL, headers=HEADERS)
    #print("------------------"+str(response.json()))
    if response.status_code != 200:
        return None
    #print(response)
    return response.json()

def getitems(character):
    pass

@app.route("/v1/quick/<name>", methods=['GET'])
def qui(name):
    with open("quick.pickle", "rb") as file4:
        response = pickle.load(file4)
    
    response = jsonify(response)
    response.headers.add("Access-Control-Allow-Origin", "*")
    return response
    

@app.route("/v1/data/<name>", methods=['GET'])
def getcharacterdata(name):
    if name != None or name != "":
        #user
        data = sendRequest("https://www.bungie.net/Platform/Destiny2/SearchDestinyPlayer/-1/"+name)
        #print(data['Response'])
    
        
        if data is None:
            #return render_template('index.html')
            pass

        #print(str(data))
        #with open('Python\Static\DB\DestinyInventoryItemDefinition.pickle', 'rb') as file1:
            #items = pickle.load(file1)

        #with open("Python\Static\DB\DestinySandboxPerkDefinition.pickle", "rb") as file2:
            #perks = pickle.load(file2)

        #with open("Python\Static\DB\DestinyStatDefinition.pickle", "rb") as file3:
            #stats = pickle.load(file3)

        with open("manifest.pickle", "rb") as file4:
            manifest = pickle.load(file4)

        user={
            "displayname": data['Response'][0]['displayName'],
            "membershipId": data['Response'][0]['membershipId'],
            "membershipType": data['Response'][0]['membershipType'],
            "characters": [], 
        }
        
        #fetching characters
        data = sendRequest("https://www.bungie.net/Platform/Destiny2/" + str(user['membershipType']) + "/Profile/" + str(user['membershipId']) + "/?components=100")
        #print(str(items))
        for character in data['Response']['profile']['data']['characterIds']:
            data = sendRequest("https://www.bungie.net/Platform/Destiny2/" + str(user['membershipType']) + "/Profile/" + str(user['membershipId']) + "/Character/" + str(character) + "/?components=200, 205")
            
            character = {
                "emblemBackground" : data['Response']['character']['data']['emblemBackgroundPath'],
                "emblemIcon" : data['Response']['character']['data']['emblemPath'],
                "lastPlayed" : data['Response']['character']['data']['dateLastPlayed'],
                "light" : data['Response']['character']['data']['light'],
                "gear" : [],
            }
            user['characters'].append(character)


            for item in data['Response']['equipment']['data']['items']:

                gear = {
                    "power": 0,
                    "staticstats": [],
                    "stats": [],
                    "perks": [],
                    "static": "",
                }
                character['gear'].append(gear)
                
                data = sendRequest("https://www.bungie.net/Platform/Destiny2/" + str(user['membershipType']) + "/Profile/" + str(user['membershipId']) + "/Item/" + str(item['itemInstanceId']) + "/?components=302, 300, 304")
                try:
                    gear['power']=data['Response']['instance']['data']['primaryStat']['value']
                except:
                    pass
                #con = sqlite3.connect('manifest.content')
                #cur = con.cursor()

                #cur.execute('SELECT json from DestinyInventoryItemDefinition where id = '+str(item['itemHash']))
                #items = cur.fetchall()
                #print(items)
                #gear['static']=items
                gear['static']=manifest['DestinyInventoryItemDefinition'][item['itemHash']]
                #print(str(data['Response']['perks']))
                #print()

                index = 0
                #print(index < len(data['Response']['perks']['data']['perks']))
                #print(index < len(data['Response']['stats']['data']['stats'].keys()))
                #print(index < len(gear['static']['investmentStats']))
                ready_perk = True
                ready_stat = True
                ready_stat2 = True
                while ready_perk or ready_stat or ready_stat2:
                    try:
                        if index < len(data['Response']['perks']['data']['perks']):
                            gear['perks'].append(manifest['DestinySandboxPerkDefinition'][data['Response']['perks']['data']['perks'][index]['perkHash']])
                        else:
                            ready_perk = False
                    except:
                        ready_perk = False
                    try:
                        stats = data['Response']['stats']['data']['stats'].keys()
                        if index < len(stats):
                            gear['stats'].append(manifest['DestinyStatDefinition'][int(stats[index])])
                        else:
                            ready_stat = False
                    except:
                        ready_stat = False

                    try:
                        if index < len(gear['static']['investmentStats']):
                            gear['stats'].append(manifest['DestinyStatDefinition'][int(gear['static']['investmentStats'][index]['statTypeHash'])])
                        else:
                            ready_stat2 = False
                    except:
                        ready_stat2 = False
                    index += 1
                    #print("-------------------------")
                    #print(ready_perk)
                    #print(ready_stat)
                    #print(ready_stat2)

                
            #print(gear)
        file = open("quick.pickle", "wb")
        file.close()

        with open("quick.pickle", "wb") as file:
            pickle.dump(user, file)

        response = jsonify(user)
        response.headers.add("Access-Control-Allow-Origin", "*")
        return response

@app.route("/v1/name/<name>")
def load_page(name):
    return render_template('index.html')
        
if __name__ == "__main__":
    app.run(debug=True)
