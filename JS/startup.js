var user;
var charactersgotten = 0;
var weaponcounter = 0;
var data_is_ready = false;

//instanced weapon perks
function getItemPerk(hashId, character, j, i, Tablename){
    //console.log(j);
    var data = new FormData();
    data.append("tablename", Tablename);
    data.append("itemData",hashId);
    data.append("key", apiKey);

    var xhr = new XMLHttpRequest();
    xhr.open("POST", "../PHP/destiny2Manifest.php");
    xhr.onload = function(){
        var json = JSON.parse(this.responseText);
        //console.log(json);
        character.gear[j].perks[i] = json;
    }
    xhr.send(data);
}

//weapon stats 2 from static weapon
function getItemStats2(hashId, character, j, i, Tablename, value){
    //console.log(hashId);
    var data = new FormData();
    data.append("tablename", Tablename);
    data.append("itemData",hashId);
    data.append("key", apiKey);

    var xhr = new XMLHttpRequest();
    xhr.open("POST", "../PHP/destiny2Manifest.php");
    xhr.onload = function(){
        var json = JSON.parse(this.responseText);
        //console.log(json);
        character.gear[j].staticstats[i] = {
            description: json.displayProperties.description,
            name: json.displayProperties.name,
            hash: json.hash,
            value: value,   
        };
    }
    xhr.send(data);
}

//precomputed instanced weapon stats
function getItemStats(hashId, character, j, i, Tablename, value){
    //console.log(hashId);
    var data = new FormData();
    data.append("tablename", Tablename);
    data.append("itemData",hashId);
    data.append("key", apiKey);

    var xhr = new XMLHttpRequest();
    xhr.open("POST", "../PHP/destiny2Manifest.php");
    xhr.onload = function(){
        var json = JSON.parse(this.responseText);
        //console.log(json);
        character.gear[j].stats[i] = {
            description: json.displayProperties.description,
            name: json.displayProperties.name,
            hash: json.hash,
            value: value,
        };
    }
    xhr.send(data);
}


//static data about weapon like name
function getItemData(hashId, character, j,  Tablename){
    //console.log(hashId);
    var data = new FormData();
    data.append("tablename", Tablename);
    data.append("itemData",hashId);
    data.append("key", apiKey);

    var xhr = new XMLHttpRequest();
    xhr.open("POST", "../PHP/destiny2Manifest.php");
    xhr.onload = function(){
        //console.log(this.responseText)
        var json = JSON.parse(this.responseText);
        //character.gear[j] = json;
        character.gear[j].static = json;

        weaponcounter++;

        var stats = Object.keys(json.stats.stats);
        //console.log(stats)
        for(var i = 0; i < stats.length; i++){
           getItemStats2(stats[i], character,j,i,'DestinyStatDefinition', json.stats.stats[stats[i]].value);
        }
    }
    xhr.send(data);
}

function getItemInfo(ID, type, itemInstanceId, character, j){
    var xhr = new XMLHttpRequest();
    
    xhr.open("GET", "https://www.bungie.net/Platform/Destiny2/" + type + "/Profile/" + ID + "/Item/" + itemInstanceId + "/?components=302, 300, 304", true);
    xhr.setRequestHeader("X-API-Key", apiKey);
    xhr.onreadystatechange = function(){
        
        if(this.readyState === 4 && this.status === 200){
            var json = JSON.parse(this.responseText);
            //console.log(json);
            var stats = Object.keys(json.Response.stats.data.stats);
            
            for(var i = 0; i < json.Response.perks.data.perks.length; i++){
                
                getItemPerk(json.Response.perks.data.perks[i].perkHash, character,j,i,  'DestinySandboxPerkDefinition');
                if(i < stats.length){
                    //console.log(stats[i])
                    getItemStats(stats[i], character,j,i,'DestinyStatDefinition', json.Response.stats.data.stats[stats[i]].value);
                }
            }

            
        }
    }
    xhr.send();
}

function getCharacterInfo(ID, type, characterId, i){
    var xhr = new XMLHttpRequest();
    var character;
    xhr.open("GET", "https://www.bungie.net/Platform/Destiny2/" + type + "/Profile/" + ID + "/Character/" + characterId + "/?components=200, 205", true);
    xhr.setRequestHeader("X-API-Key", apiKey);
    xhr.onreadystatechange = function(){
        
        if(this.readyState === 4 && this.status === 200){
            var json = JSON.parse(this.responseText);
            //console.log(json);
            //console.log(json.Response.equipment.data.items);
            character = {
                    emblemBackground : json.Response.character.data.emblemBackgroundPath,
                    emblemIcon : json.Response.character.data.emblemPath,
                    lastPlayed : json.Response.character.data.dateLastPlayed,
                    light : json.Response.character.data.light,
                    gear : [],
            };
            user.characters[i] = character;
            weaponcounter = 0;
            charactersgotten++;
            for(var j = 0; j < json.Response.equipment.data.items.length; j++){

                user.characters[i].gear[j] = {
                    staticstats: [],
                    stats: [],
                    perks: [],
                    static: "",
                };
                
                getItemInfo(ID, type, json.Response.equipment.data.items[0].itemInstanceId, user.characters[i], j);
                getItemData(json.Response.equipment.data.items[j].itemHash, user.characters[i], j, 'DestinyInventoryItemDefinition');
                //character.gear[j] = json.Response.equipment.data.items[j].itemHash;
            }
            //console.log(characters);
         
       
        }
        
        
    }
    xhr.send();
}


function getCharacters(ID, type) {
    
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "https://www.bungie.net/Platform/Destiny2/" + type + "/Profile/" + ID + "/?components=100", true);
    xhr.setRequestHeader("X-API-Key", apiKey);
    xhr.onreadystatechange = function(){
        
        if(this.readyState === 4 && this.status === 200){
            var json = JSON.parse(this.responseText);
            var profile = json.Response;
            //console.log(json);
            //console.log(profile.profile.data.characterIds);
            
            
            for(var i = 0; i < profile.profile.data.characterIds.length; i++){
                //console.log(profile.profile.data.characterIds[i]);
                //console.log("character: " + i);
                getCharacterInfo(ID, type, profile.profile.data.characterIds[i], i);
            }

            

            
        }
    }
    xhr.send();
}


function createUser() {
    var name = "Khalidium";
    var xhr = new XMLHttpRequest();

    xhr.open("GET", "https://www.bungie.net/Platform/Destiny2/SearchDestinyPlayer/-1/" + name, true);
    xhr.setRequestHeader("X-API-Key", apiKey);
    xhr.onreadystatechange = function(){
        if(this.readyState === 4 && this.status === 200){
            var json = JSON.parse(this.responseText);
            var users = json.Response;
            //console.log(users[0]);
            user = {
                displayname: users[0].displayName,
                membershipId: users[0].membershipId,
                membershipType: users[0].membershipType,
                characters: [],
            };
            //user = new User(users[0].displayName, users[0].membershipId, users[0].membershipType);
            getCharacters(users[0].membershipId, users[0].membershipType);
            console.log(user);
            data_is_ready = true;

        }
    }
    xhr.send();

};