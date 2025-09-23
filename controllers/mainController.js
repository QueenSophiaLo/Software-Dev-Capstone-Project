exports.index = (req, res, next)=> {
    res.render('./index');
};

exports.team = (req, res, next)=> {
    res.render('./meet-the-team');
};

exports.contact = (req, res, next)=> {
    res.render('./contact-us');
};