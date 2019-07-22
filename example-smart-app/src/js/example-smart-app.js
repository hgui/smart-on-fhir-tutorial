(function(window){
  window.extractData = function() {
    var ret = $.Deferred();

    function onError() {
      console.log('Loading error', arguments);
      ret.reject();
    }

    function onReady(smart)  {
      if (smart.hasOwnProperty('patient')) {
        var patient = smart.patient;
        console.log('patient info', patient);
        var pt = patient.read();
        var obv = smart.patient.api.fetchAll({
                    type: 'Observation',
                    query: {
                      code: {
                        $or: ['http://loinc.org|8302-2', 'http://loinc.org|8462-4',
                              'http://loinc.org|8480-6', 'http://loinc.org|2085-9',
                              'http://loinc.org|2089-1', 'http://loinc.org|55284-4',
                              'http://loinc.org|50398-7'
                            ]
                      }
                    }
                  });
        var diagnostic = smart.patient.api.fetchAll({
          type: 'DiagnosticReport'
        });
        console.log('diagnostic', diagnostic);
        console.log('.read and .fetchAll', pt, obv);

        $.when(pt, obv).fail(onError);

        $.when(pt, diagnostic).done(function(patient, diagnostic) {
          if(diagnostic.length > 0){
            var byCodes = smart.byCodes(diagnostic, 'code');
            console.log('diagnostic inside when', diagnostic);
            var p = defaultPatient();
            var presented = diagnostic[0].presentedForm;
            var performer = diagnostic[0].performer.display;
            p.presented = presented;
            p.performer = performer;
            console.log('presented', p.presented);
            console.log('performer', p.performer);
            const Http = new XMLHttpRequest();
            const url='https://jsonplaceholder.typicode.com/posts';
            Http.open("GET", url);
            Http.send();

            Http.onreadystatechange = (e) => {
              console.log('testing http get', Http.responseText);
            }
          }
        });

        $.when(pt, obv).done(function(patient, obv) {
          console.log('patient', patient);
          console.log('observation inside when', obv);
          var byCodes = smart.byCodes(obv, 'code');
          console.log('byCodes', byCodes);
          console.log('checking codes- height', byCodes('8302-2'));
          console.log('checking diagnositc report', byCodes('50398-7'));
          var gender = patient.gender;

          var fname = '';
          var lname = '';

          if (typeof patient.name[0] !== 'undefined') {
            fname = patient.name[0].given.join(' ');
            lname = patient.name[0].family.join(' ');
          }

          var height = byCodes('8302-2');
          var systolicbp = getBloodPressureValue(byCodes('55284-4'),'8480-6');
          var diastolicbp = getBloodPressureValue(byCodes('55284-4'),'8462-4');
          var hdl = byCodes('2085-9');
          var ldl = byCodes('2089-1');
          console.log('hdl', hdl);
          console.log('ldl', ldl);
          console.log('trying other search', smart.patient.api.search({type: 'DiagnosticReport'}));
          console.log('bloodpressure', byCodes('55284-4'));

          var p = defaultPatient();
          p.birthdate = patient.birthDate;
          p.gender = gender;
          p.fname = fname;
          p.lname = lname;
          p.height = getQuantityValueAndUnit(height[0]);

          if (typeof systolicbp != 'undefined')  {
            p.systolicbp = systolicbp;
          }

          if (typeof diastolicbp != 'undefined') {
            p.diastolicbp = diastolicbp;
          }

          p.hdl = getQuantityValueAndUnit(hdl[0]);
          p.ldl = getQuantityValueAndUnit(ldl[0]);

          ret.resolve(p);
        });
      } else {
        onError();
      }
    }

    FHIR.oauth2.ready(onReady, onError);
    return ret.promise();

  };

  function defaultPatient(){
    return {
      fname: {value: ''},
      lname: {value: ''},
      gender: {value: ''},
      birthdate: {value: ''},
      height: {value: ''},
      systolicbp: {value: ''},
      diastolicbp: {value: ''},
      ldl: {value: ''},
      hdl: {value: ''},
      presented: {value: ''},
      performer: {value: ''},
    };
  }

  function getBloodPressureValue(BPObservations, typeOfPressure) {
    var formattedBPObservations = [];
    BPObservations.forEach(function(observation){
      var BP = observation.component.find(function(component){
        return component.code.coding.find(function(coding) {
          return coding.code == typeOfPressure;
        });
      });
      if (BP) {
        observation.valueQuantity = BP.valueQuantity;
        formattedBPObservations.push(observation);
      }
    });

    return getQuantityValueAndUnit(formattedBPObservations[0]);
  }

  function getQuantityValueAndUnit(ob) {
    if (typeof ob != 'undefined' &&
        typeof ob.valueQuantity != 'undefined' &&
        typeof ob.valueQuantity.value != 'undefined' &&
        typeof ob.valueQuantity.unit != 'undefined') {
          return ob.valueQuantity.value + ' ' + ob.valueQuantity.unit;
    } else {
      return undefined;
    }
  }

  window.drawVisualization = function(p) {
    $('#holder').show();
    $('#loading').hide();
    $('#fname').html(p.fname);
    $('#lname').html(p.lname);
    $('#gender').html(p.gender);
    $('#birthdate').html(p.birthdate);
    $('#height').html(p.height);
    $('#systolicbp').html(p.systolicbp);
    $('#diastolicbp').html(p.diastolicbp);
    $('#ldl').html(p.ldl);
    $('#hdl').html(p.hdl);
  };

})(window);
