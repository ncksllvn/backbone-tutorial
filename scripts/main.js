
// Backbone GitHub Demo App
// This is purely an example for Backbone best practices
// Notice that the whole app is event-driven, rarely calling
// functions on one another, but instead just listening for events.


// The only global
var router

// Router
// ======================================
var Router = Backbone.Router.extend({

    initialize: function(){

        // initialize the collection
        var gitHubUsers = new GitHubUsers

        // initialize views
        this.addUserForm = new AddUserForm({ collection: gitHubUsers })
        this.UserList = new UserList({ collection: gitHubUsers })
        
        // pass in a reference to this router so that it can listen for route events
        this.mainContent = new MainContent({ router: this, collection: gitHubUsers })
        
        // No route events are fired until this method is called
        this.listenToOnce(gitHubUsers, 'sync', this.startApp)
    },
    
    startApp: function(){
        Backbone.history.start()
    },

    routes: {
        ''                : 'onRouteHome',
        'users/:user'     : 'onRouteUser'
    }
    
})

// Model
// ====================================
var GitHubUser = Backbone.Model.extend({

    defaults: function(){
        return {
            login: 'Username',
            name: '',
            avatar_url: null
        }
    },
    
    // url can be defined as a function in case your API scheme doesn't
    // follow the Backbone default, myApi.com/users/:id
    url: function(){
        return 'https://api.github.com/users/' + this.get('login')
    },
    
    // Override on destroy, which would normally send an HTTP DELETE request
    // because we can't actually delete from GitHub's database
    destroy: function(){
        this.trigger('destroy')
    }

})

// Collection
// =====================================
var GitHubUsers = Backbone.Collection.extend({

    url: 'https://api.github.com/users',

    model: GitHubUser
})


// Views
// ======================================================

// This is a simple form that just waits for you to click the button
// Then adds that username to the collection
var AddUserForm = Backbone.View.extend({

    el: $('#user-form'),
    
    events: {
        'click button': 'addUser'
    },
    
    addUser: function(){
        var username = $('#github-username').val()
        var user = new GitHubUser({ login: username })
        
        this.$('#github-username').val('')
        this.collection.add(user)
    }

})

// The sidebar with the list of users. This calls fetch on the colleciton
// to initialize itself, then adds each as a View. It also adds a View everytime
// anything is added to the collection.
var UserList = Backbone.View.extend({

    el: $('#user-list'),
    
    initialize: function(){
        this.listenTo(this.collection, 'add', this.addListItem)
        
        var _this = this
        this.collection.fetch({
            success: function(gitHubUsers){
                gitHubUsers.forEach(_this.addListItem)
            }
        })
    },
    
    addListItem: function(newUser){
        var listItem = new UserListItem({ model: newUser })
        listItem.render().$el.prependTo(this.$el)
    }
    
})

// Each individual list item is responsible for fetching their model's data if needed
var UserListItem = Backbone.View.extend({

    template: _.template( $('#user-list-item' ).html() ),

    initialize: function(){
        this.listenTo(this.model, 'destroy', this.remove)
    },
    
    render: function(){
        
        // New users added to the collection will need to fetch the rest of their
        // data before it can render, so it just shows a loader and calls fetch on the model
        if (this.model.isNew()){
            this.model.fetch({ success: _.bind( this.onUserFetched, this) })
            this.$el.html('<span class="glyphicon glyphicon-refresh"> </span>')
        }
        else 
            this.onUserFetched()
    
        return this
    },
    
    onUserFetched: function(){
        var modelAttributes = this.model.toJSON()
        var html = this.template(modelAttributes)
        this.$el.html(html)
    },
    
    events: {
        'click .delete' : 'onClickDelete'
    },
    
    onClickDelete: function(){
        this.model.destroy()
    }

})

// The main content will listen for route events, and automatically display the clicked user based on
// the id in the URL, which it will use to pull the right user out of the collection
var MainContent = Backbone.View.extend({

    el: $('#main-content'),

    template: _.template( $('#main-content-template').html() ),
    
    defaultHtml: '<h3>Welcome to the Github user look-up</h3><p>GitHub only allows a few API hits before you have to wait 5 minutes, FYI.</p>',
    
    userNotFound: '<h3>We couldn\'t find that user.</h3>',
    
    initialize: function(options){
        this.listenTo(options.router, 'route:onRouteHome', this.setDefaultHtml)
        this.listenTo(options.router, 'route:onRouteUser', this.render)
    },
    
    setDefaultHtml: function(){
        this.$el.html(this.defaultHtml)
    },
    
    render: function(userId){
        var model = this.collection.get(userId)
        
        if ( !model ) {
            this.$el.html(this.userNotFound)
            return this
        }
        
        var modelAttributes = model.toJSON()
        var html = this.template(modelAttributes)
        
        this.$el.html(html)
        return this
    }

})



// ========================================================
// Initialize the router: all logic for starting the app is in its initialize function
// ========================================================
router = new Router


