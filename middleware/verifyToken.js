import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {

    const authHeader = req.headers.authorization;
    let token;

    if (authHeader && req.cookies.accessToken !== '') {
    
        token = authHeader.split(" ")[1];
        
    if (token) {

        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {

            if (err) {

                if (err.name === 'TokenExpiredError') {
                    return res.status(401).json({ error: 'Token has expired' });
                }

                return res.status(401).json({ error: 'Token is not valid!' });
            }

            req.user = user;
            next();
        });

    } 
    else {
        return res.status(401).json({ error: 'You are not authenticated' });
    }

}

};



export const verifyTokenAndSuperadmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                if (err.name === 'TokenExpiredError') {
                    return res.status(401).json({ error: 'Token has expired' });
                }
                return res.status(401).json({ error: 'Token is not valid!' });
            }

            req.user = user;
             next();
         
        });
    } else {
        return res.status(401).json({ error: 'You are not authenticated' });
    }
};
 

  



     
            







  