 var couchapp = require('couchapp')
  , path = require('path')

ddoc = 
  { _id:'_design/library'
  , rewrites : 
    [ {from:"/", to:'index.html'}
    , {from:"/api", to:'../../'}
    , {from:"/api/*", to:'../../*'}
    , {from:"/*", to:'*'}
    ]
  }
  

ddoc.views = {
    
  
  /*
   * Get all grades and number of documents in that grade.
   * 
   * /_design/hammock/_view/grades?group=true
   */
  grades: {
    map: function(doc){ 
      if (doc.grade && doc.type == 'resource') {
        emit(doc.grade, 1)
      }
    },
    reduce: function(keys, values) {
      return values.length
    }
  },
  

  /*
   * Get all subjects in each grade and number of documents in that grade subject.

  view: _design/hammock/_view/grade_subjects?group_level=1
  result: distinct grades and number of documents in that grade.

  view: _design/hammock/_view/grade_subjects?group=true&startkey=[1,"a"]&endkey=[1,"z"]
  result: all subjects for grade one
      
  */
  grade_subjects: {
    map: function(doc) {
      if (doc.grade && doc.subject && doc.type == 'resource') {
        emit([doc.grade, doc.subject], doc._id)
      }
    },
    reduce: function(tag, counts) {
      return tag.length
    } 
  },


  subject_levels: {
    map: function(doc) {
      if (doc.subject && doc.level && doc.type == 'resource') {
        emit([doc.subject, doc.level], doc._id)
      }
    },
    reduce: function(tag, counts) {
      return tag.length
    } 
  },

  /*
   * Get all resources for given grade and subject.
   * @todo Figure out how to modify the reduce in grade_subjects view so I we can roll this 
     view into it.

  view: _design/hammock/_view/grade_subjec_resourcess?key=['grade', 'subject']
  result: A list of document IDs for the given grade and subject.
      
  */
  grade_subject_resources: {
    map: function(doc) {
      if (doc.grade && doc.subject && doc.type == 'resource') {
        emit([doc.grade, doc.subject], doc.title)
      }
    }
  },

  subject_level_resources: {
    map: function(doc) {
      if (doc.subject && doc.level && doc.type == 'resource') {
        emit([doc.subject, doc.level], doc.title)
      }
    }
  },

  /*
   * SELECT subject FROM documents_table;
   */
  subjects_all: {
    map: function(doc) {
      if (doc.subject && doc.type == 'resource') {
        emit(doc.subject, 1)
      }
    }
  },


  grades_all: {
    map: function(doc){ 
      if (doc.grade && doc.type == 'resource') {
        emit(doc.grade, 1)
      }
    }
  },

  groups: {
    map: function(doc) {
      if (doc.type == "group") {
        emit(doc._id, null)
      }
    }
  },

  resources: {
    map: function(doc) {
      if (doc.type == "resource") {
        emit(doc._id, null)
      }
    }
  },

  feedback_all: {
    map: function(doc) {
      if (doc.type == "feedback") {
        emit(doc._id, true)
      }
    }
  },

  feedback_by_resource: {
    map: function(doc) {
      if (doc.type == "feedback") {
        emit(doc.resource, doc._id)
      }
    }
  },  

  /*
   * _design/library/_view/feedback_rating_totals?group=true&startkey=["resource-0001","1"]&endkey=["resource-0001","5"]
   */
  feedback_rating_totals: {
    map: function(doc) {
      if (doc.type == "feedback") {
        emit([doc.resource, doc.rating], doc.rating)
      }
    },
    reduce: function(keys, values, rereduce) {
      if(!rereduce) {
        log("keys")
        log(keys)
        log("values")
        log(values)
        return values.length
      }
      else {
        log("REREDUCE ENGAGE")
      }
    }
  }

}

ddoc.validate_doc_update = function (newDoc, oldDoc, userCtx) {   
  if (newDoc._deleted === true && userCtx.roles.indexOf('_admin') === -1) {
    throw "Only admin can delete documents on this database."
  } 
}

couchapp.loadAttachments(ddoc, path.join(__dirname, 'attachments'))

module.exports = ddoc