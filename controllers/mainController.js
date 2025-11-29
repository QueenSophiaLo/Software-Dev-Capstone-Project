exports.index = (req, res, next) => {
    // Define the mock data strictly as requested
    const mockWidgetData = {
        status: 'DEFICIT',
        netAmount: '($3,156.58)', // Parentheses usually indicate negative in accounting
        income: '$2,599.02',
        expenses: '$5,755.60'
    };

    // Pass this data to the view
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
