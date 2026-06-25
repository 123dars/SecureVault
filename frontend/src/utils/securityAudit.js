export const runSecurityAudit = (decryptedPasswords) => {
    const auditResults = {
        weakPasswords: [], // List of sites with short passwords
        reusedPasswords: [], // List of passwords used on multiple sites
        totalScore: 100
    };

    const passwordCounts = {};

    decryptedPasswords.forEach(entry => {
        const pwd = entry.password;
        
        // 1. Identify weak passwords (< 8 chars)
        if (pwd.length < 8) {
            auditResults.weakPasswords.push(entry.site_name);
            auditResults.totalScore -= 5;
        }

        // 2. Track reuse
        passwordCounts[pwd] = (passwordCounts[pwd] || 0) + 1;
    });

    // Flag reused passwords
    Object.keys(passwordCounts).forEach(pwd => {
        if (passwordCounts[pwd] > 1) {
            auditResults.reusedPasswords.push(pwd);
            auditResults.totalScore -= 10;
        }
    });

    // Prevent score from dropping below 0
    if (auditResults.totalScore < 0) auditResults.totalScore = 0;

    return auditResults;
};