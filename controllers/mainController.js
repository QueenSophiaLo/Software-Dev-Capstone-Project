exports.index = (req, res, next) => {

    const mockWidgetData = {
        status: 'DEFICIT',
        netAmount: '($3,156.58)', 
        income: '$2,599.02',
        expenses: '$5,755.60'
    };

    res.render('./index', { 
        financialSummary: mockWidgetData 
    });
};

exports.team = (req, res, next)=> {
    res.render('./meet-the-team');
};

exports.contact = (req, res, next)=> {
    res.render('./contact-us');
};
