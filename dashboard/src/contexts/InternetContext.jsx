import React, { createContext, useContext, useEffect, useState } from "react";

const InternetContext = createContext();

export const InternetProvider = ({ children }) => {
	const [isOnline, setIsOnline] = useState(true);
	const [pendingActions, setPendingActions] = useState([]);

	const checkInternet = async () => {
		if (!navigator.onLine) {
			setIsOnline(false);
			return false;
		}

		try {
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), 3000);

			await fetch("https://www.cloudflare.com/cdn-cgi/trace", {
				cache: "no-store",
				signal: controller.signal,
			});

			clearTimeout(timeout);
			setIsOnline(true);
			return true;
		} catch {
			setIsOnline(false);
			return false;
		}
	};

	useEffect(() => {
		checkInternet();

		const onlineHandler = async () => {
			const ok = await checkInternet();
			if (ok && pendingActions.length) {
				pendingActions.forEach(fn => fn());
				setPendingActions([]);
			}
		};

		const offlineHandler = () => setIsOnline(false);

		window.addEventListener("online", onlineHandler);
		window.addEventListener("offline", offlineHandler);

		return () => {
			window.removeEventListener("online", onlineHandler);
			window.removeEventListener("offline", offlineHandler);
		};
	}, [pendingActions]);

	return (
		<InternetContext.Provider
			value={{
				isOnline,
				checkInternet,
				queueAction: (fn) =>
					setPendingActions(prev => [...prev, fn]),
			}}
		>
			{children}
		</InternetContext.Provider>
	);
};

export const useInternet = () => useContext(InternetContext);
