/*
*   Initializes and exports the Socket.IO controller.
*/

const Server = require('socket.io')
module.exports = {
    
    init(httpServer) {

        this.socket = new Server(httpServer)
        this.socket.on('connection', () => {
            
            console.log('Socket client connected')
            this.socket.on('disconnect', () => {
                console.log('Socket client disconnected')
            })
        
        })

    },

}
