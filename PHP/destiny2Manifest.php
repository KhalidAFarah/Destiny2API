<?php
define('COOKIE_FILE', 'cookie.txt');
define('BUNGIE_URL', 'https://www.bungie.net');
define('API_KEY', $_POST['key']);
define('USER_AGENT', 'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.1) Gecko/20061204 Firefox/2.0.0.1');

define('SETTING_FILE', 'settings.json');

$default_options = array(
    CURLOPT_USERAGENT => USER_AGENT,
    CURLOPT_COOKIEJAR => COOKIE_FILE,
    CURLOPT_COOKIEFILE => COOKIE_FILE,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_SSL_VERIFYHOST => 2,
);

function loadSettings() {
    if (!file_exists(SETTING_FILE)) return new stdClass();
    return json_decode(file_get_contents(SETTING_FILE));
}
function setSetting($name, $value) {
    $settings = loadSettings();
    $settings->{$name} = $value;
    file_put_contents(SETTING_FILE, json_encode($settings));
}
function getSetting($name) {
    $settings = loadSettings();
    if (isset($settings->{$name})) return $settings->{$name};
    return '';
}

function parseCookieFile($file) {
    $cookies = array();
    if (file_exists($_SERVER['DOCUMENT_ROOT'].'/'.$file)) {
        $lines = file($file);
        foreach($lines as $line) {
            if (substr_count($line, "\t") == 6) {
                $tokens = explode("\t", $line);
                $tokens = array_map('trim', $tokens);

                $domain = preg_replace('/#[^_]+_/i', '', $tokens[0]);
                $flag = $tokens[1] == 'TRUE';
                $path = $tokens[2];
                $secure = $tokens[3] == 'TRUE';
                $expiration = $tokens[4];
                $name = $tokens[5];
                $value = $tokens[6];
                if (!isset($cookies[$domain])) $cookies[$domain] = array();
                $cookies[$domain][$name] = array(
                    'flag' => $flag,
                    'path' => $path,
                    'secure' => $secure,
                    'expiration' => $expiration,
                    'value' => $value
                );
            }
        }
    }
    return $cookies;
}

function doRequest($path) {
    global $default_options;

    $cookies = parseCookieFile(COOKIE_FILE);
    $bungieCookies = isset($cookies['www.bungie.net']) ? $cookies['www.bungie.net'] : array();

    $ch = curl_init(BUNGIE_URL.$path);
    curl_setopt_array($ch, $default_options);
    curl_setopt_array($ch, array(
        CURLOPT_HTTPHEADER => array(
            'x-api-key: '.API_KEY,
            'x-csrf: '.(isset($bungieCookies['bungled']) ? $bungieCookies['bungled']['value'] : '')
        )
    ));
    $response = curl_exec($ch);
    curl_close($ch);

    return json_decode($response);
}

function updateManifest($url) {
    $ch = curl_init(BUNGIE_URL.$url);
    curl_setopt_array($ch, array(
        CURLOPT_RETURNTRANSFER => true
    ));
    $data = curl_exec($ch);
    curl_close($ch);

    $cacheFilePath = 'cache/'.pathinfo($url, PATHINFO_BASENAME);
    if (!file_exists(dirname($cacheFilePath))) mkdir(dirname($cacheFilePath), 0777, true);
    file_put_contents($cacheFilePath.'.zip', $data);

    $zip = new ZipArchive();
    if ($zip->open($cacheFilePath.'.zip') === TRUE) {
        $zip->extractTo('cache');
        $zip->close();
    }

    $tables = array();
    if ($db = new SQLite3($cacheFilePath)) {
        $result = $db->query("SELECT name FROM sqlite_master WHERE type='table'");
        while($row = $result->fetchArray()) {
            $table = array();
            $result2 = $db->query("PRAGMA table_info(".$row['name'].")");
            while($row2 = $result2->fetchArray()) {
                $table[] = $row2[1];
            }
            $tables[$row['name']] = $table;
        }
    }

    return $tables;
}

function checkManifest() {
    // Checking for Manifest changes.
    $result = doRequest('/Platform/Destiny2/Manifest/');

    // Grab the path of the language you want
    $database = $result->Response->mobileWorldContentPaths->en;

    // Check to see if had been changed
    if ($database != getSetting('database')) {
        // New database found.
        $tables = updateManifest($database);
        setSetting('database', $database);
        setSetting('tables', $tables);
    }
}

function queryManifest($query) {
    $database = getSetting('database');
    $cacheFilePath = 'cache/'.pathinfo($database, PATHINFO_BASENAME);

    $results = array();
    if ($db = new SQLite3($cacheFilePath)) {
        $result = $db->query($query);
        while($row = $result->fetchArray()) {
            $key = is_numeric($row[0]) ? sprintf('%u', $row[0] & 0xFFFFFFFF) : $row[0];
            $results[$key] = json_decode($row[1]);
        }
    }
    return $results;
}

function getDefinition($tableName) {
    return queryManifest('SELECT * FROM '.$tableName);
}

function getSingleDefinition($tableName, $id) {
    $tables = getSetting('tables');

    $key = $tables->{$tableName}[0];
    $where = ' WHERE '.(is_numeric($id) ? $key.'='.$id.' OR '.$key.'='.($id-4294967296) : $key.'="'.$id.'"');
    $results = queryManifest('SELECT * FROM '.$tableName.$where);

    return isset($results[$id]) ? $results[$id] : false;
}

function getAmountOfItems($tableName) {
    $tables = getSetting('tables');

    $key = $tables->{$tableName}[0];
    //$where = ' WHERE '.(is_numeric($id) ? $key.'='.$id.' OR '.$key.'='.($id-4294967296) : $key.'="'.$id.'"');
    $results = queryManifest('SELECT COUNT(id) FROM '.$tableName);

    return isset($results) ? $results : false;
}

function createItemJSON($tableName) {
    $tables = getSetting('tables');

    $key = $tables->{$tableName}[0];
    //$where = ' WHERE '.(is_numeric($id) ? $key.'='.$id.' OR '.$key.'='.($id-4294967296) : $key.'="'.$id.'"');
    $results = queryManifest('SELECT json FROM '.$tableName);

    //return $results; //isset($results[$id]) ? $results[$id] : false;
    file_put_contents('cache/items.json',json_encode($results));
}

//checkManifest();
//createItemJSON('DestinyInventoryItemDefinition');

//echo '<pre>Get Gjallarhorn: '.json_encode(getAmountOfItems('DestinyInventoryItemDefinition')).'</pre>';
//echo $_POST['Table'];

print_r(json_encode(getSingleDefinition($_POST['tablename'] , $_POST['itemData'])));

//echo '<pre>Get Gjallarhorn: '.json_encode(getSingleDefinition('DestinyInventoryItemDefinition', 3745990145), JSON_PRETTY_PRINT).'</pre>';

//echo '<pre>DestinyInventoryBucketDefinition: '.json_encode(getDefinition('DestinyInventoryBucketDefinition'), JSON_PRETTY_PRINT).'</pre>';

//echo '<pre>'.json_encode(file_get_contents('cache/items.json'), JSON_PRETTY_PRINT).'</pre>';

