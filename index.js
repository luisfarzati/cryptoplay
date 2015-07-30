angular
.module('crypto', ['ngSanitize'])
.controller('CryptoController', function ($scope) {
  var HEX_KEYCODES = [48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,97,98,99,100,101,102]

  var ctrl = this

  var algorithms = ctrl.algorithms = [
    {
      name: 'plain',
      selected: true,
      symmetric: true,
      bytes: function (utf8String) {
        return CryptoJS.enc.Utf8.parse(utf8String)
      },
      encode: function (bytes) {
        try {
          return CryptoJS.enc.Latin1.stringify(bytes)
        }
        catch(e) {}
      }
    },
    {
      name: 'base64',
      selected: true,
      symmetric: true,
      bytes: function (base64String) {
        return CryptoJS.enc.Base64.parse(base64String)
      },
      encode: function (bytes) {
        return CryptoJS.enc.Base64.stringify(bytes)
      }
    },
    {
      name: 'hex',
      selected: true,
      symmetric: true,
      bytes: function (hexString) {
        return CryptoJS.enc.Hex.parse(hexString)
      },
      encode: function (bytes) {
        return CryptoJS.enc.Hex.stringify(bytes)
      }
    },
    {
      name: 'sha256',
      selected: true,
      bytes: function (hexString) {
        return CryptoJS.enc.Hex.parse(hexString)
      },
      encode: function (bytes) {
        if (bytes.sigBytes) return CryptoJS.SHA256(bytes)
      },
      stringify: function (sha256bytes) {
        return sha256bytes && CryptoJS.enc.Hex.stringify(sha256bytes)
      }
    },
    {
      name: 'hmac-sha256',
      selected: true,
      bytes: function (hexString) {
        return CryptoJS.enc.Hex.parse(hexString)
      },
      encode: function (bytes, secret) {
        if (bytes.sigBytes) return CryptoJS.HmacSHA256(bytes, 's')
      },
      stringify: function (sha256bytes) {
        return sha256bytes && CryptoJS.enc.Hex.stringify(sha256bytes)
      }
    }
  ]

  ctrl.input = algorithms[0]

  ctrl.toggle = function (alg) {
    alg.selected = !alg.selected
  }

  ctrl.keypress = function (event) {
    if (ctrl.input.name === 'Hex' && HEX_KEYCODES.indexOf(event.key||event.keyCode||event.which) < 0) {
      event.preventDefault()
    }
  }

  ctrl.switchInput = function (alg) {
    ctrl.input = alg
  }

  $scope.$watch('ctrl.source', function (value) {
    if (value == null) return
    ctrl.bytes = ctrl.input.bytes(value)
  })

  $scope.$watch('ctrl.input', function (input) {
    if (!input || !ctrl.bytes) return

    var reencoded = input.encode(ctrl.bytes)
    ctrl.source = (input.stringify||angular.identity)(reencoded)
  })
})

.directive('tabs', function () {
  return {
    restrict: 'A',
    link: function (scope, elem) {
      elem.addClass('tabs')
      var unwatch = scope.$watch('ctrl.algorithms', function (value) {
        if (!value) return
        $(elem).tabs()
        unwatch()
      })
    }
  }
})

.filter('exclude', function () {
  return function (array, match) {
    if (!match) return array
    return array.filter(function (item) { return item.name != match.name })
  }
})
.filter('parse', function () {
  return function (string, encoding) {
    if (!encoding) return
    return encoding.bytes(string || '')
  }
})
.filter('encode', function () {
  return function (bytes, alg) {
    if (!bytes || !alg) return
    return alg.encode(bytes)
  }
})
.filter('stringify', function () {
  return function (encoded, alg) {
    if (!alg) return
    return (alg.stringify||angular.identity)(encoded)
  }
})
.filter('length', function () {
  return function (stringOrBytes) {
    if (!stringOrBytes) return 0
    return stringOrBytes.sigBytes || stringOrBytes.length
  }
})
.filter('hmacsha256', function () {
  return function (string, secret) {
    return (string||'').length? CryptoJS.HmacSHA256(string, secret || '') : undefined
  }
})
.filter('md5', function () {
  return function (string) {
    return (string||'').length? CryptoJS.MD5(string) : undefined
  }
})
.filter('hex', function () {
  return function (string) {
    return (string||'').length? CryptoJS.enc.Hex.stringify(CryptoJS.enc.Utf8.parse(string)) : undefined
  }
})
.filter('aes', function () {
  return function (string, secret) {
    return (string||'').length? CryptoJS.AES.encrypt(string, secret || '') : undefined
  }
})
.directive('contenteditable', function ($sce) {
  return {
    restrict: 'A', // only activate on element attribute
    require: '?ngModel', // get a hold of NgModelController
    link: function(scope, element, attrs, ngModel) {
      if (!ngModel) return; // do nothing if no ng-model

      // Specify how UI should be updated
      ngModel.$render = function() {
        element.html($sce.getTrustedHtml(ngModel.$viewValue || ''));
      };

      // Listen for change events to enable binding
      element.on('blur keyup change', function() {
        scope.$evalAsync(read);
      });
      read(); // initialize

      // Write data to the model
      function read() {
        var html = element.html();
        // When we clear the content editable the browser leaves a <br> behind
        // If strip-br attribute is provided then we strip this out
        if ( attrs.stripBr && html == '<br>' ) {
          html = '';
        }
        ngModel.$setViewValue(html);
      }
    }
  }
})

$(document).ready(function () {
  $('.toc-wrapper').pushpin()
  $('.hidden').show()
})
