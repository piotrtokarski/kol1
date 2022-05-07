//import listy wszystkich zmiennych wykorzystywanych przez program i ich opisów
import variables from "./zmienne.json" assert { type: "json" };

//czy zostały już sprawdzone
let checked = false;

//obiekt dla każdej zmiennej, który definiuje dla każdej zmiennej funkcję walidującą
const validators = {
	"EXPRESS_PORT": () => (
		// musi to być liczba
		isNaN(process.env["EXPRESS_PORT"]) ? (
			"Port musi być liczbą"
		) : (
			false
		)
	)
};

//funkcja sprawdzająca zmienne środowiskowe (envy)
const check = () => {
	for (const [var_name, var_description] of Object.entries(variables)) {
		if (!process.env[var_name]) {
			throw new Error(`${var_description} - nie zostało ustawione! Należy dodać ${var_name} w '.env'`);
		}
	}

	let err;
	for (const [var_name, validator] of Object.entries(validators)) {
		if (err = validator()) {
			if (typeof err === "string") {
				console.error("env/validator:", err);
			}
			throw new Error(`${variables[env_var]} - nie przeszło walidacji! Należy sprawdzić ${var_name} w '.env'`);
		}
	}

	//gdy przeszło zmieniamy wartość tej zmiennej na true
	checked = true;
};

//funkcja, która zwraca wartość zmiennej środowiskowej
const get = (var_name) => (
	Object.keys(variables).includes(var_name) ? (
		process.env[var_name]
	) : (
		(() => { throw new Error(`Próba użycia niesprawdzonego enva: ${var_name}`) })()
	)
);

//funkcja, która wymusza walidację zmiennych środowiskowych
const safe_get = (var_name) => {
	if (!checked)
		check_env();

	return get(var_name);
}

export {
	check,
	safe_get
};
