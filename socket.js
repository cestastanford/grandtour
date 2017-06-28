/*
*   Initializes and exports the Socket.IO controller.
*/

module.exports = {
    
    init(server) {

        this.io = require('socket.io')(server)
        this.io.on('connection', () => {
            
            console.log('Client socket connected')
            this.io.on('disconnect', () => {
                console.log('Client socket disconnected')
            })
        
        })

    },

}
