import api from "../../services/api";

const useDashboard = () => {

    const find = async (params) => {
        try {
            const { data } = await api.request({
                url: `/dashboard`,
                method: 'GET',
                params,
                timeout: 30000 // 30 seconds timeout
            });
            
            // Validate response structure
            if (!data || typeof data !== 'object') {
                throw new Error('Invalid response format from dashboard API');
            }
            
            // Ensure counters exist and have proper structure
            const counters = data.counters || {};
            const attendants = Array.isArray(data.attendants) ? data.attendants : [];
            
            return {
                counters: {
                    supportPending: Number(counters.supportPending) || 0,
                    supportHappening: Number(counters.supportHappening) || 0,
                    supportFinished: Number(counters.supportFinished) || 0,
                    leads: Number(counters.leads) || 0,
                    avgSupportTime: Number(counters.avgSupportTime) || 0,
                    avgWaitTime: Number(counters.avgWaitTime) || 0
                },
                attendants: attendants.map(attendant => ({
                    ...attendant,
                    rating: attendant.rating !== null ? Number(attendant.rating) : null,
                    avgSupportTime: Number(attendant.avgSupportTime) || 0,
                    online: Boolean(attendant.online),
                    profileImage: attendant.profileImage || null
                }))
            };
        } catch (error) {
            console.error('Dashboard API error:', error);
            
            // Return default data structure in case of error
            return {
                counters: {
                    supportPending: 0,
                    supportHappening: 0,
                    supportFinished: 0,
                    leads: 0,
                    avgSupportTime: 0,
                    avgWaitTime: 0
                },
                attendants: []
            };
        }
    }

    return {
        find
    }
}

export default useDashboard;