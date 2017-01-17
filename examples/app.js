$(document).ready(function(){
      window.mymap = new GMaps({
        el: '#map',
        lat: 40.52835,
        lng: -74.437367,
      });
    });
    
    function locateMe(){
      window.mymap.removeMarkers();
      window.mymap.cleanRoute();
      GMaps.geolocate({
        success: function(position){
          window.mymap.setCenter(position.coords.latitude, position.coords.longitude);
          window.mymap.addMarker({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            title: 'me',
            click: function(e) {
              alert('You clicked in this marker');
            }
          });

        },
        error: function(error){
          alert('Geolocation failed: '+error.message);
        },
        not_supported: function(){
          alert("Your browser does not support geolocation");
        },
        always: function(){
          //alert("Done!");
        }
      })
    };
    function formatLineString(pts){
      var retStr = "LINESTRING("
      
      function myformat(n) {
        return (n>0?'+':'') + n;
      }

      for(var i=0; i < pts.length; i++){
        var pt = pts[i]
        retStr = retStr + myformat(pt[0]) + myformat(pt[1]);
        if (i < pts.length-1){
          retStr = retStr + ","
        }
      } 
      return retStr + ")"
    }

    function routeMe(){
      window.mymap.removeMarkers();
      window.mymap.cleanRoute();
      window.myaddresses = [];
      findAddress($('#origin-input').val(), function(addr){
        window.myaddresses.push(addr);
        window._origin = addr;
      });
      //console.log(window.myaddresses)
      findAddress($('#destination-input').val(), function(addr){
          window.myaddresses.push(addr);
          window._dest = addr;
          window.mymap.drawRoute({                              
            origin: window.myaddresses[0],
            destination: window.myaddresses[1],
            travelMode: 'driving',
            strokeColor: '#131540',
            strokeOpacity: 0.6,
            strokeWeight: 6
            });
          // zoom in
          center = [(window.myaddresses[0][0] + window.myaddresses[1][0])/2, (window.myaddresses[0][1] + window.myaddresses[1][1])/2]
          window.mymap.fitZoom();
          window.mymap.getRoutes({
            origin: window.myaddresses[0],
            destination: window.myaddresses[1],
            travelMode: 'driving',
            callback: function(e){
              route = new GMaps.Route({
                map: window.mymap,
                route: e[0],
                strokeColor: '#336699',
                strokeOpacity: 0.5,
                strokeWeight: 10
                });
              var pts = []
              for(var s of route.route.overview_path){
                //console.log(s.lat())
                //console.log(s.lng())
                pts.push([s.lng(), s.lat()])
                //console.log("--")
              }       
              lineStr = formatLineString(pts)
                                 
              $.ajax({
                url:"http://developer.nrel.gov/api/alt-fuel-stations/v1/nearby-route.json?route=" + lineStr,
                data:{api_key:"DEMO_KEY", distance:"2",fuel_type:"all"},
                type:'get',
                success:function(res){
                  console.log(res.fuel_stations)
                  window.stations =res.fuel_stations;

                  for (var i = 0; i < res.fuel_stations.length; i++){
                    var station = res.fuel_stations[i]
                     
                    var stationMarker = window.mymap.addMarker({
                      lat: station.latitude,
                      lng: station.longitude,
                      //icon:pinImage,
                      icon:"../gmapMarkers/green_MarkerA.png",
                      //primaryColor:"#0000FF",
                      //details: {icon:"../gmapMarkers/green_MarkerA.png"},
                      title: 'fuel',
                      click: function(e) {
                        alert('You clicked in this fuel');
                      }
                    });       
                  }
                  window.mymap.fitZoom();          
                },
                error: function (xhr, ajaxOptions, thrownError) {
                alert("data too large");
                // alert(thrownError);
                }
              });    
            }
          });

      });
    }

    function findAddress(str, callback){
      var latlng = -1
      GMaps.geocode({
        address: str,
        callback: function(results, status) {
          if (status == 'OK') {
            latlng = results[0].geometry.location;
            window.mymap.addMarker({
            lat: latlng.lat(),
            lng: latlng.lng()
          });
          callback([latlng.lat(), latlng.lng()])
          //latlng = results[1].formatted_address;
          }
        }
      });
    }
    function changeGas()
    {
      //console.log("jin");
      var gasType = $('#gasType').val();
      //console.log(gasType);
      if(window.stations == null)
        return;
      //console.log("maker.leg"+window._markers.length);
      window.mymap.removeMarkers();

      window.mymap.addMarker({
            lat: window._origin[0],
            lng: window._origin[1],
            title: 'orig',
            click: function(e) {
              alert('You clicked in this origin');
            }
          });
      
      window.mymap.addMarker({
            lat: window._dest[0],
            lng: window._dest[1],
            title: 'dest',
            click: function(e) {
              alert('You clicked in this dest');
            }
          });


      console.log("stations,leg:" + window.stations.length);
      for (var i = 0; i < window.stations.length; i++){
         var station = window.stations[i]
         if(gasType != "all" && (station.fuel_type_code != gasType))
          continue;
          //console.log(station.fuel_type_code);
          window.mymap.addMarker({
            lat: station.latitude,
            lng: station.longitude,
            //icon:pinImage,
            icon:"../gmapMarkers/green_MarkerA.png",
            title: 'fuel',
            click: function(e) {
              alert('You clicked in this fuel');
            }
          });
          window.mymap.fitZoom();
       }
    }