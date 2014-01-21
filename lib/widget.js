/**
 * Widget for storing the users location
 *
 * Register on document ready with: 
 *  $( "[type='gps']" ).gps();
 *
 * Retrieve the GPS JSON object with:
 *    JSON.parse(document.getElementsByName('location')[0].value)
 */
$.widget( "custom.gps", {
  _create: function() {
    var _elem = this.element;
    _elem.hide();

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        function(pos) {
          _elem.val(JSON.stringify({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            elevation: pos.coords.altitude
          }));
        },
        this._error,
        {timeout: 5000} 
      );
    } else {
      console.warn("Your browser doesn't support geolocation");
    }
  },
  _error: function(err) {
    console.warn('ERROR(' + err.code + '): ' + err.message);
  }
});