<?php
    $username ="cb1989";
    $passwort ="iephoo7zeechoh7u";
    $hostname ="127.0.0.1";
    $database ="wagnerwatch";
    $server = mysql_connect($hostname, $username, $passwort);
    $connection = mysql_select_db($database, $server)

    if (!$server)
    {
        echo "Connection lost";
    }
    else {
        echo "Connection successful";
    }
?>