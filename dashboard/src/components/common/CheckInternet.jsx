import { useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { useInternet } from "../../contexts/InternetContext";

export default function CheckInternet() {
	const { isOnline } = useInternet();
	const prevStatus = useRef(isOnline);

	useEffect(() => {
		if (prevStatus.current && !isOnline) {
			toast.warn("Please check your internet connection");
		}
		if (!prevStatus.current && isOnline) {
			toast.success("Internet connection restored");
		}
		prevStatus.current = isOnline;
	}, [isOnline]);

	return null;
}
