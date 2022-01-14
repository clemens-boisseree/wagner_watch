if ($(window).width() >= 1024) {
    var startzoom = 20;
} else {
    var startzoom = 24;
}

var map = L.map('map', {
    zoomAnimation: false,
    zoomControl: false,
    scrollWheelZoom: true,
    minZoom: 18,
    maxZoom: 28
}).setView([0, 0], startzoom);

map.on('focus', function () {
    map.scrollWheelZoom.enable();
});
map.on('blur', function () {
    map.scrollWheelZoom.disable();
});

map.attributionControl.setPosition('bottomleft');
map.attributionControl.addAttribution("Quelle: <a href='https://stats.nba.com/'>stats.nba.com</a>, nach einer Idee der <a href='http://graphics.latimes.com/kobe-every-shot-ever/'>LA Times</a>");



var maxBounds = L.latLngBounds(
    L.latLng(-0.0008965214248875757, -0.0007082520424338494),
    L.latLng(0.0002627572497869783,0.0006917906352883794)
);
map.setMaxBounds(maxBounds);

L.control.zoom({
    position: 'bottomright'
}).addTo(map);



function getRadius() {
    var currentZoom = map.getZoom();
    var radius;
    if (currentZoom <= 20) {
        radius = 4
    } else if (currentZoom === 21) {
        radius = 6;
    } else if (currentZoom === 22) {
        radius = 8;
    } else if (currentZoom === 23) {
        radius = 10;
    } else if (currentZoom === 24) {
        radius = 12;
    } else if (currentZoom >= 25) {
        radius = 14;
    }
    return radius;
}

function style(feature) {
    if (feature.properties.SHOT_MADE_FLAG == 1) {
        return {
            fillColor: '#4387C4',
            radius: getRadius(),
            weight: 0.3,
            color: "#000",
            fillOpacity: 0.6,
        }
    } else {
        return {
            fillColor: '#FED500',
            radius: getRadius(),
            weight: 0.3,
            color: "#000",
            fillOpacity: 0.6,
        }
    }
}

function addFeatureBlock(_this, features) {
    var block = features.splice(0, 2500);

    if (block.length) {
        for (var i = 0, len = block.length; i < len; i++) {
            var feature = block[i];
            if (feature.geometries || feature.geometry || feature.features || feature.coordinates) {
                L.GeoJSON.prototype.addData.call(_this, feature);
            }
        }

        window.requestAnimationFrame(function () {
            addFeatureBlock(_this, features);
        });
    }
}

var url = '/data/franz.json';


L.TopoJSON = L.GeoJSON.extend({
    addData: function (jsonData) {
        if (jsonData.type === 'Topology') {
            for (var key in jsonData.objects) {
                geojson = topojson.feature(jsonData, jsonData.objects[key]);

                var features = geojson.features;
                addFeatureBlock(this, features);
            }
        } else {
            L.GeoJSON.prototype.addData.call(this, jsonData);
        }
    }
});

//////////////////
//// Layer //////
////////////////

var allewuerfe;

function handleClick(e) {
    var object = e.target.feature.properties;
    renderTooltip(object);
}

function clickFeature(e) {
    var layer = e.target;
}

function onEachFeature(feature, layer) {
    layer.on({
        click: handleClick,
        mouseover: highlightFeature,
        mouseout: resetHighlight,
    });
}

function highlightFeature(e) {
    resetHighlight(e);
    var layer = e.target;
    layer.setStyle({
        weight: 1.2,
    });
}

function resetHighlight(e) {
    var layer = e.target;
    layer.setStyle({
        weight: 0.3,
    });
}

allewuerfe = new L.TopoJSON(null, {
    onEachFeature: onEachFeature,
    style: style,
    pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, allewuerfe);
    }
});

$.getJSON(url, function (data) {
    allewuerfe.addData(data);
});

var data = L.layerGroup([allewuerfe]);
data.addTo(map);


function addTopoData(topoData) {
    data.addData(topoData);
    data.addTo(map);
}

map.on('zoomend', function () {
    allewuerfe.setStyle(style)
})

///////////////////
//// Filter //////
/////////////////
var filter = {};

function process() {
    data.clearLayers();
    var shots = new L.TopoJSON(null, {

        onEachFeature: onEachFeature,
        style: style,
        pointToLayer: function (feature, latlng) {
            return L.circleMarker(latlng, shots);
        },
        filter: function (feature, layer) {
            return (!filter.shotresult || feature.properties.SHOT_MADE_FLAG == filter.shotresult) &&
                (!filter.opponent || feature.properties.HTM == filter.opponent || feature.properties.VTM == filter.opponent) &&
                (!filter.season || feature.properties.SEASON == filter.season) &&
                (!filter.gametype || feature.properties.GAME_TYPE == filter.gametype);
        }
    });
    $.getJSON(url, function (data) {
        shots.addData(data);
    });
    data.addLayer(shots);

    map.on('zoomend', function () {
        shots.setStyle(style)
    })
}

$("#shotresult").change(function () {
    filter.shotresult = $(this).val();
    process();
});

$("#opponent").change(function () {
    filter.opponent = $(this).val();
    process();
});

$("#season").change(function () {
    filter.season = $(this).val();
    process();
});

$("#gametype").change(function () {
    filter.gametype = $(this).val();
    process();
});

function reset() {
    data.clearLayers();
    $("#shotresult").prop('selectedIndex', 0);
    $("#opponent").prop('selectedIndex', 0);
    $("#season").prop('selectedIndex', 0);
    $("#gametype").prop('selectedIndex', 0);
    filter.opponent = $("#opponent").val();
    filter.shotresult = $("#shotresult").val();
    filter.season = $("#season").val();
    filter.gametype = $("#gametype").val();
}

$("#all").click(function () {
    reset();
    data.addLayer(allewuerfe);
    data.addTo(map);
});

var buzzer = document.getElementsByClassName("buzzer");
for (var i = 0; i < buzzer.length; i++) {
    buzzer[i].addEventListener('click', function (event) {
        theExpression = 'feature.properties.MINUTES_RE == "00:00" ';
        reset();
        buzzer = new L.TopoJSON(null, {
            onEachFeature: onEachFeature,
            style: style,
            pointToLayer: function (feature, latlng) {
                return L.circleMarker(latlng, buzzer);
            },
            filter: function (feature, layer) {
                return (feature.properties.MINUTES_RE == "00:00");
            }
        });

        $.getJSON(url, function (data) {
            buzzer.addData(data);
        });

        data.addLayer(buzzer);
        data.addTo(map);

        map.on('zoomend', function () {
            buzzer.setStyle(style)
        })
    })
};

var bestgame = document.getElementsByClassName("bestgame");
for (var i = 0; i < bestgame.length; i++) {
    bestgame[i].addEventListener('click', function (event) {
        theExpression = 'feature.properties.GAME_DATE == "02.12.2004" ';
        reset();
        bestgame = new L.TopoJSON(null, {

            onEachFeature: onEachFeature,
            style: style,
            pointToLayer: function (feature, latlng) {
                return L.circleMarker(latlng, bestgame);
            },
            filter: function (feature, layer) {
                return (feature.properties.GAME_DATE == "02.12.2004");
            }
        });

        $.getJSON(url, function (data) {
            bestgame.addData(data);
        });

        data.addLayer(bestgame);
        data.addTo(map);

        map.on('zoomend', function () {
            bestgame.setStyle(style)
        })
    })
};

var firstshot = document.getElementsByClassName("firstshot");
for (var i = 0; i < firstshot.length; i++) {
    firstshot[i].addEventListener('click', function (event) {
        theExpression = 'feature.properties.GAME_ID == "29800012" ';
        reset();
        firstshot = new L.TopoJSON(null, {

            onEachFeature: onEachFeature,
            style: style,
            pointToLayer: function (feature, latlng) {
                return L.circleMarker(latlng, firstshot);
            },
            filter: function (feature, layer) {
                return (feature.properties.GAME_ID == "29800012");
            }
        });

        $.getJSON(url, function (data) {
            firstshot.addData(data);
        });

        data.addLayer(firstshot);
        data.addTo(map);

        map.on('zoomend', function () {
            firstshot.setStyle(style)
        })
    })
};

var lastshot = document.getElementsByClassName("lastshot");
for (var i = 0; i < lastshot.length; i++) {
    lastshot[i].addEventListener('click', function (event) {
        theExpression = 'feature.properties.GAME_ID == "21801227" ';
        reset();
        lastshot = new L.TopoJSON(null, {

            onEachFeature: onEachFeature,
            style: style,
            pointToLayer: function (feature, latlng) {
                return L.circleMarker(latlng, lastshot);
            },
            filter: function (feature, layer) {
                return (feature.properties.GAME_ID == "21801227");
            }
        });

        $.getJSON(url, function (data) {
            lastshot.addData(data);
        });

        data.addLayer(lastshot);
        data.addTo(map);

        map.on('zoomend', function () {
            firstshot.setStyle(style)
        })
    })
};


var finals = document.getElementsByClassName("finals");
for (var i = 0; i < finals.length; i++) {
    finals[i].addEventListener('click', function (event) {
        theExpression = 'feature.properties.SEASON == "2010-11" && feature.properties.GAME_TYPE == "P" && feature.properties.HTM == "MIA" || feature.properties.VTM == "MIA"';
        reset();
        finals = new L.TopoJSON(null, {
            onEachFeature: onEachFeature,
            style: style,
            pointToLayer: function (feature, latlng) {
                return L.circleMarker(latlng, firstshot);
            },
            filter: function (feature, layer) {
                return (feature.properties.SEASON == "2010-11") && (feature.properties.GAME_TYPE == "P") && (feature.properties.HTM == "MIA" || feature.properties.VTM == "MIA");
            }
        });
        $.getJSON(url, function (data) {
            finals.addData(data);
        });

        data.addLayer(finals);
        data.addTo(map);

        map.on('zoomend', function () {
            finals.setStyle(style)
        })
    })
};


//////////////////
//// Court //////
////////////////

var courtLayer = new L.TopoJSON(null, {
    style: function (feature) {
        return {
            color: "#000",
            fillColor: '#f4f4f4',
            fillOpacity: 0,
            opacity: 0.5,
            weight: 1,
        }
    }
});
$.getJSON('https://raw.githubusercontent.com/clemens-boisseree/wagner_watch/main/court.json').done(addTopoData);
function addTopoData(topoData) {
    courtLayer.addData(topoData);
    courtLayer.addTo(map);
}


//////////////////
//// Tooltip ////
////////////////


function getColor(x) {
    return x == 'n.a.' ? '#ccc' :
        x == 0 ? '#d7191c' :
        x == 1 ? '#1a9641' :
        '#ccc';
};

var teamMap = {
    ATL: "Atlanta Hawks",
    BKN: "Brooklyn Nets",
    BOS: "Boston Celtics",
    CHA: "Charlotte Hornets",
    CHI: "Chicago Bulls",
    CLE: "Cleveland Cavaliers",
    DAL: "Dallas Mavericks",
    DEN: "Denver Nuggets",
    DET: "Detroit Pistons",
    GSW: "Golden State Warriors",
    HOU: "Houston Rockets",
    IND: "Indiana Pacers",
    LAC: "Los Angeles Clippers",
    LAL: "Los Angeles Lakers",
    MEM: "Memphis Grizzlies",
    MIA: "Miami Heat",
    MIL: "Milwaukee Bucks",
    MIN: "Minnesota Timberwolves",
    NJN: "New Jersey Nets",
    NOP: "New Orleans Pelicans",
    NYK: "New York Knicks",
    OKC: "Oklahoma City Thunder",
    PHI: "Philadelphia 76ers",
    PHX: "Phoenix Suns",
    POR: "Portland Trail Blazers",
    SAC: "Sacramento Kings",
    SAS: "San Antonio Spurs",
    SEA: "Seattle SuperSonics (bis 2008)",
    TOR: "Toronto Raptors",
    UTA: "Utah Jazz",
    VAN: "Vancouver Grizzlies (bis 2001>",
    WAS: "Washington Wizards"
};

function renderTooltip(data) {
    tooltip = $("#tooltip");
    tooltip.fadeIn();
    dataGEGNER = teamMap[data.HTM !== 'ORL' ? data.HTM : data.VTM];
    dataHeim = data.HTM;
    dataGast = data.VTM;
    dataWurf = data.SHOT_MADE_FLAG;
    colorWurf = getColor(dataWurf);
    game = data.GAME_TYPE;
    shot = data.SHOT_TYPE;
    video = data.video;


    if ("3" == shot) {
        shot = "3-Pt-Wurf"
    } else {
        shot = "2-Pt-Wurf"
    }

    if ("R" == game) {
        game = "Regular"
    } else {
        game = "Playoffs"
    }

    if ("DAL" == dataHeim) {
        dataHeim = " (H)"
    } else {
        dataHeim = " (A)"
    }

    tooltip.find(".head").css("border-bottom", "2px solid " + colorWurf);
    tooltip.find(".Gegner").text(dataGEGNER);
    tooltip.find(".Heimspiel").text(dataHeim);
    tooltip.find(".Saison").text(data.SEASON);
    tooltip.find(".Spiel").text(game);
    tooltip.find(".Datum").text(data.GAME_DATE);
    tooltip.find(".Wurf").css("color", colorWurf);
    tooltip.find(".Wurf").text(shot);
    tooltip.find(".Entfernung").text((data.SHOT_DISTANCE * 0.31).toFixed(2).toString().replace(".", ","));
    tooltip.find(".Typ").text(data.ACTION_TYP);
    tooltip.find(".Spielzeit").text(data.MINUTES_RE);
    tooltip.find(".Viertel").text(data.PERIOD);
    tooltip.find(".link a").attr('href', 'https://stats.nba.com/game/' + "00" + encodeURIComponent(data.GAME_ID));
    if (video) {
        document.getElementById('video').style.display = 'block';
        tooltip.find(".video-link iframe").attr('src', video);
    }
    else {
        document.getElementById('video').style.display = 'none';
        tooltip.find(".video-link iframe").attr('src', "");
    }
}
$("#close").click(function () {
    tooltip.fadeOut();
});

$("#close-desktop").click(function () {
    tooltip.fadeOut();
});

$("#layerControl").click(function () {
    if (tooltip.fadeIn) {
        tooltip.fadeOut();
    }
});

$(".backButton").on("click", function (e) {
    e.preventDefault();
    window.location = "https://interaktiv.rp-online.de/dirk-nowitzki-karriereende";
});

//////////////////
//// Menu    ////
////////////////

function mobilemenu() {
    var x = document.getElementById("layerControl");
    if (x.className === "topnav") {
        x.className += " responsive";
    } else {
        x.className = "topnav";
    }
}

$(".flex-grid button").click(function () {
    $(".topnav").removeClass('responsive');
})

$(".flex-grid select").change(function () {
    $(".topnav").removeClass('responsive');
});

map.spin(true);
setTimeout(function () {
    data.addLayer(allewuerfe);
    map.spin(false);
}, 5000);


$(".more").click(function() { 
    $("#greetingOverlay").fadeOut();
});

$(".readmore").click( function(){
    if($(".readmore span").text().indexOf("Mehr erfahren") != -1 ) {
        $(".fa-caret-down").hide();
        $(".fa-caret-up").show();
        $(".more-box").show();
        $(".readmore span").text("Verbergen ");

    } else {
        $(".fa-caret-down").show();
        $(".fa-caret-up").hide();
        $(".more-box").hide();
        $(".readmore span").text("Mehr erfahren ");
    }
});