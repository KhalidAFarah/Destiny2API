<!DOCTYPE html>
<html>
<head>
<title>Page Title</title>
</head>
<body>
    
    <?php
    //"https://www.bungie.net/Platform/common/destiny2_content/sqlite/en/world_sql_content_4538153d085eb7c87e59c58aefc70fb1.content"
        //$cacheFilePath = pathinfo('cache');
    //print_r($cacheFilePath);
        file_put_contents('cache.zip',  file_get_contents("https://www.bungie.net/common/destiny2_content/sqlite/en/world_sql_content_4538153d085eb7c87e59c58aefc70fb1.content"));

        $zip = new ZipArchive();
        if ($zip->open('cache.zip') === TRUE) {
            $zip->extractTo($_SERVER['DOCUMENT_ROOT'].'/cache');
            $zip->close();
        }
    
    //----------------------------------------------------------------------

    
    
        if ($db = new SQLite3('cache.zip')) {

    $result = $db->query("SELECT name FROM sqlite_master WHERE type='table'");
    
    while($row = $result->fetchArray()) {
        $result2 = $db->query('SELECT * FROM '.$row['name']);
        $data = array();
        while ($col = $result2->fetchArray(true)) {
            $json = json_decode($col['json'], true);    

            if (isset($col['id'])) {
                $data[$col['id']] = $json;
            } else if (isset($col['key'])) {
                $data[$col['key']] = $json;
            } else {
                $data[] = $json;
            }
        }
        if (!file_exists('DestinyInventoryItemDefinition')) mkdir('DestinyInventoryItemDefinition');
        file_put_contents('DestinyInventoryItemDefinition/'.$row['name'].'.json', json_encode($data));
    }
}

    ?> 
</body>
</html>