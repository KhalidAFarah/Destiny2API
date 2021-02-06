var user;

function getItemData(hashId, i, j, Tablename){
    //console.log(character);
    var data = new FormData();
    data.append("Table", Tablename);
    data.append("itemData",hashId);
    data.append("key", apiKey);

    var xhr = new XMLHttpRequest();
    xhr.open("POST", "../PHP/destiny2Manifest.php");
    xhr.onload = function(){
        var json = JSON.parse(this.responseText);
        //console.log(this.responseText);
        i.gear[j] = json;
    }
    xhr.send(data);
}
function getItemInfo(ID, type, itemInstanceId){
    var xhr = new XMLHttpRequest();
    
    xhr.open("GET", "https://www.bungie.net/Platform/Destiny2/" + type + "/Profile/" + ID + "/Item" + itemInstanceId + "/?components=302, 300, 304", true);
    xhr.setRequestHeader("X-API-Key", apiKey);
    xhr.onreadystatechange = function(){
        
        if(this.readyState === 4 && this.status === 200){
            var json = JSON.parse(this.responseText);
            console.log(json);
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
            for(var j = 0; j < json.Response.equipment.data.items.length; j++){
                
                getItemData(json.Response.equipment.data.items[j].itemHash, user.characters[i], j, "DestinyInventoryItemDefinition");
                getItemInfo(ID, type, json.Response.equipment.data.items[0].itemInstanceId);
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
        }
    }
    xhr.send();

};
