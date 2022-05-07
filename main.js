//wczytujemy zmienne środowikowe z pliku .env
import dotenv from "dotenv";
dotenv.config();

//import wykorzystanych bibliotek npm
import express from "express";
import geoip from "fast-geoip";
import clm from "country-locale-map";
import ipaddrJs from "ipaddr.js";
import publicIp from "public-ip";

//import funkcji pomocniczych do obsługi zmiennych środowiskowych
import { check as check_env, safe_get } from "./env.js";

//wywołanie funkcji sprawdzającej, czy zmienne środowiskowe zostały poprawnie zdefiniowane
check_env();

//wczytujemy konfigurację zmiennych środowiskowych
const PORT = safe_get("EXPRESS_PORT"),
	AUTHOR = safe_get("AUTHOR");

//funkcja pomocnicza zwracająca strefę czasową dla wybranej daty
function getTimezone(time) {
	if (!time instanceof Date)
		return String();

	//przesunięcie strefy czasowej w godzinach - konwersja z minut na godziny
	const hours = time.getTimezoneOffset() / 60, prefix = hours >= 0 ? '+' : '-', hours_abs = Math.abs(hours);
	return `GMT${prefix}${String(hours_abs).padStart(2, '0').padEnd(4, '0')}`;
}

//funkcja sprawdzająca adres IP
async function getPublicIp(addr) {
	if (typeof addr !== "string")
		return null;

	//jeśli adres jest adresem IPv4 zmapowanym na IPv6 to go odmapowujemy
	const ip = (
		(
			(ip) => (
				ip?.isIPv4MappedAddress?.() ? (
					ip.toIPv4Address()
				) : (
					ip
				)
			)
		)(ipaddrJs.parse(addr))
	);

	//jeżeli adres jest jednym z tych zakresów z tablicy to jest adresem prywatnym, którego nie możemy zlokalizować
	//możemy natomiast użyć wtedy adresu publicznego serwera
	return (
		[
			"unspecified",
			"broadcast",
			"linkLocal",
			"loopback",
			"private",
			"reserved"
		].includes(ip.range()) ? (
			await Promise.any([
				publicIp.v4(),
				publicIp.v6()
			])
		) : (
			ip.toString()
		)
	);
}

//tworzenie obiektu aplikacji w szkielecie programistycznym express
const app = express();
//ufamy serwerom proxy, dzięki czemu jako adres IP zapytania zostanie wczytana zawartość nagłówków np. X-Forwarded-For
app.set("trust proxy", true);

//dodajemy funkcję obsługującą zapytanie na głównym adresie
app.get(
	"/",
	async (req, res) => {
		const ip = await getPublicIp(req.ip),
			{ timezone, country: country_code } = await geoip.lookup(ip),
			locale = clm.getCountryByAlpha2(country_code).default_locale.replaceAll('_', '-')
		;

		res.send(`
			<p>IP: ${ip}</p>
			<p>Strefa czasowa: ${timezone}</p>
			<p>Data i godzina: ${new Date().toLocaleString(locale, { timeZone: timezone })}</p>
		`);
	}
);

//uruchamianie serwera
app.listen(
	PORT, 
	() => {
		const date = getTimezone(new Date());

		//zapisanie informacji w logu
		console.log(
`Serwer uruchomiony

Kolokwium 1
Uruchomiono: ${date} 
Autor: ${AUTHOR}
Port: ${PORT}`
		);
	}
);
