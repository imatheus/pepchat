import { useState, useEffect, useCallback } from "react";
import { socketConnection } from "../../services/socket";

const useUserStatus = () => {
  const [usersStatus, setUsersStatus] = useState(new Map());

  const updateUserStatus = useCallback((userId, online) => {
    setUsersStatus(prevStatus => {
      const newStatus = new Map(prevStatus);
      newStatus.set(userId, {
        online,
        lastUpdate: new Date()
      });
      return newStatus;
    });
  }, []);

  const getUserStatus = useCallback((userId) => {
    return usersStatus.get(userId)?.online || false;
  }, [usersStatus]);

  const getAllUsersStatus = useCallback(() => {
    const statusObject = {};
    usersStatus.forEach((status, userId) => {
      statusObject[userId] = status.online;
    });
    return statusObject;
  }, [usersStatus]);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    if (!companyId) return;

    const socket = socketConnection({ companyId });

    const userStatusListener = (data) => {
      const { userId, online } = data;
      updateUserStatus(userId, online);
    };

    socket.on(`company-${companyId}-userStatus`, userStatusListener);

    return () => {
      socket.off(`company-${companyId}-userStatus`, userStatusListener);
      socket.disconnect();
    };
  }, [updateUserStatus]);

  return {
    getUserStatus,
    getAllUsersStatus,
    updateUserStatus,
    usersStatus: usersStatus
  };
};

export default useUserStatus;