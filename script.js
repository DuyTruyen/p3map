'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class WorkOut {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }

  _setDescription() {
    // prettier-ignore

    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase() + this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}
class Running extends WorkOut {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends WorkOut {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

class App {
  #map;
  #mapEvent;
  #mapZoomLevel = 17;
  #workouts = [];

  constructor() {
    
    this._getPosition();

    form.addEventListener('submit', this._newWorkOut.bind(this));
    inputType.addEventListener('change', this._toggle);


    containerWorkouts.addEventListener(
      'click',
      this._moveToWorkOutMarker.bind(this)
    );
    this._getLocalStore();
  }

  _getPosition() {
    navigator.geolocation.getCurrentPosition(
      this._loadMap.bind(this),
      function () {
        alert('Khong the truy cap vi tri');
      }
    );
  }

  _loadMap(locationVn) {
    // console.log(this);

    // console.log(locationVn);

    const longitude = locationVn.coords.longitude;
    const latitude = locationVn.coords.latitude;
    const coords = [latitude, longitude];
console.log(coords);

    this.#map = L.map('map').setView(coords, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map)





    L.marker(coords).addTo(this.#map)
    .bindPopup('Your Location')
    .openPopup();

    this.#map.on('click', this._showForm.bind(this));


    this.#workouts.forEach(
      work => {
        
      this.renderWorkOutMarker(work);
    });



  }

  _showForm(mapE) {
    this.#mapEvent = mapE;

    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    inputDistance.value =
    inputDuration.value =
    inputElevation.value =
    inputCadence.value =
      '';
    form.classList.add('hidden');
  }

  _toggle() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkOut(e) {
    e.preventDefault();    

    //// Validate dữ liệu
    const { lat, lng } = this.#mapEvent.latlng;
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const vlValue = (...inputs) => inputs.every(inp => Number.isFinite(inp));
    const soDuong = (...inputs) => inputs.every(inp => inp > 0);
    let workout;

    if (type == 'running') {
      const cadence = +inputCadence.value;
      if (
        !vlValue(distance, duration, cadence) ||
        !soDuong(distance, duration, cadence)
      )
        return alert('Du lieu khong dung');
      workout = new Running([lat, lng], distance, duration, cadence);
    }

    if (type == 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !vlValue(distance, duration, elevation) ||
        !soDuong(distance, duration, elevation)
      )
        return alert('Du lieu khong dung');

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }
    // console.log(workout);

    ////////////////////////

    this.#workouts.push(workout);


    this.renderWorkOutMarker(workout);
    // console.log(this);
    

    this._hideForm();
    this.renderWorkOut(workout);
    

    this._setLocalStore();
 
    
  }
  renderWorkOutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 500,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        }).setContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}
        ${workout.description}`)
      )
      .openPopup();
  }

  renderWorkout(workout) {
    let html = `<li class="workout workout--${workout.type}" data-id="${
      workout.id
    }">
    <h2 class="workout__title">${workout.description}</h2>
    <div class="workout__details">
      <span class="workout__icon"> 
      ${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}
      </span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>`;

    if (workout.type === 'running')
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
      </li>
      `;

    if (workout.type === 'cycling')
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.elevationGain}</span>
          <span class="workout__unit">m</span>
        </div>
      </li>
      `;
    form.insertAdjacentHTML('afterend', html);
  }

  _moveToWorkOutMarker(e) {
    const el = e.target.closest('.workout');
    if (!el) return;
    const workout = this.#workouts.find(work => work.id == el.dataset.id);

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _setLocalStore() {
    console.log(this.#workouts);
    
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStore() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    // console.log(data);
    
    if (!data) return;
    this.#workouts = data;

    this.#workouts.forEach(
      work => {
        this.renderWorkout(work);
      
    });
  }
}

const app = new App();

//   // Click map
