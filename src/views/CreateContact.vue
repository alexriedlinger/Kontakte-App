<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button :icon="closeOutline" text="" default-href="/contacts" style="color: var(--ion-color-primary)"></ion-back-button>
        </ion-buttons>
        <ion-title>Kontakt erstellen</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="solid" shape="round" class="save-button" @click="createContact">Speichern</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-grid>
        <ion-row class="m-0" style="display: flex; align-items: center;">
          <ion-icon class="custom-icon m-auto" :icon="personOutline" aria-hidden="true" ></ion-icon>
          <ion-col>
            <ion-item>
              <ion-input v-model="firstName" type="text" label="Vorname" label-placement="floating" placeholder=""></ion-input>
            </ion-item>
          </ion-col>
        </ion-row>
        <ion-row class="m-0" style="display: flex; align-items: center;">
          <ion-icon class="custom-icon invisible-icon m-auto" :icon="personOutline" aria-hidden="true"></ion-icon>
          <ion-col>
            <ion-item>
              <ion-input v-model="lastName" type="text" label="Nachname" label-placement="floating" placeholder=""></ion-input>
            </ion-item>
          </ion-col>
        </ion-row>
        <ion-row class="m-0" style="display: flex; align-items: center;">
          <ion-icon class="custom-icon m-auto" :icon="callOutline" aria-hidden="true"></ion-icon>
          <ion-col>
            <ion-item>
              <ion-input v-model="phoneNumber" type="tel" label="Telefon" label-placement="floating" placeholder=""></ion-input>
            </ion-item>
          </ion-col>
        </ion-row>
        <ion-row class="m-0" style="display: flex; align-items: center;">
          <ion-icon class="custom-icon m-auto" :icon="mailOutline" aria-hidden="true"></ion-icon>
          <ion-col>
            <ion-item>
              <ion-input v-model="email" type="email" label="E-Mail" label-placement="floating" placeholder=""></ion-input>
            </ion-item>
          </ion-col>
        </ion-row>
        <ion-row class="m-0" style="display: flex; align-items: center;">
          <ion-icon class="custom-icon m-auto" :icon="calendarOutline" aria-hidden="true"></ion-icon>
          <ion-col>
            <ion-item button @click="openBirthdayPicker" :detail=false>
              <ion-input v-model="displayedBirthday" inputmode="none" :readonly="true" label="Geburtstag" label-placement="floating"></ion-input>
            </ion-item>
          </ion-col>
        </ion-row>
      </ion-grid>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonPage,
  IonRow,
  IonTitle,
  IonToolbar,
  alertController,
} from '@ionic/vue';

import { 
  callOutline,
  calendarOutline,
  closeOutline,
  mailOutline,
  personOutline, 
} from 'ionicons/icons';

import {
  BirthdayInput,
  ContactInput,
  Contacts,
  CreateContactOptions,
  CreateContactResult,
  EmailType,
  PhoneType,
} from '@capacitor-community/contacts';

import { DatetimePicker } from '@capawesome-team/capacitor-datetime-picker';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import EventBus from '@/router/EventBus';

const router = useRouter();

const firstName = ref('');
const lastName = ref('');
const phoneNumber = ref('');
const email = ref('');
const displayedBirthday = ref('');
const birthdayInput = ref<BirthdayInput | null>(null);

// Function to create a new contact
const createContact = async () => {
  // Check for missing information
  if (!firstName.value.trim() && !lastName.value.trim() && !phoneNumber.value.trim() && !email.value.trim() && !displayedBirthday.value.trim()) {
    // Show an alert for missing information
    const alert = await alertController.create({
      header: 'Fehlende Informationen',
      message: 'Bitte fülle mindestens ein Feld aus, um den Kontakt zu erstellen.',
      buttons: ['OK'],
    });

    await alert.present();
    return;
  }

  // Prepare the contact input
  const newContact: ContactInput = {
    name: {
      given: firstName.value.trim() !== '' ? firstName.value.trim() : undefined,
      family: lastName.value.trim() !== '' ? lastName.value.trim() : undefined,
    },
    phones: phoneNumber.value.trim() !== '' ? [{
      type: PhoneType.Home,
      number: phoneNumber.value.trim(),
    }] : [],
    emails: email.value.trim() !== '' ? [{
      type: EmailType.Work,
      address: email.value.trim(),
    }] : [],
    birthday: birthdayInput.value || null
    };

  const createContactOptions: CreateContactOptions = {
    contact: newContact,
  };

  try {
    // Create the contact
    const result: CreateContactResult = await Contacts.createContact(createContactOptions);
    const createdContactId = result.contactId;

    // Emit an event for contact creation and redirect to contact detail page
    EventBus.emit('createdContact');

    // Clear form values
    firstName.value = '';
    lastName.value = '';
    phoneNumber.value = '';
    email.value = '';
    displayedBirthday.value = '';
    birthdayInput.value = null;
    
    try {
      // Redirect to the newly created contact's detail page
      router.push({ path: `/contacts/${createdContactId}` });
    } catch (error) {
      console.error("Routing Error", error);
    }
  } catch (error) {
    // Handle contact creation error
    console.error('Error creating contact:', error);
    const alert = await alertController.create({
      header: 'Fehler',
      message: 'Beim Erstellen des Kontakts ist ein Fehler aufgetreten.',
      buttons: ['Erneut versuchen'],
    });

    await alert.present();
  }
};

// Function to open the birthday picker
const openBirthdayPicker = async () => {
  try {
    const currentDate = new Date();

    const { value } = await DatetimePicker.present({
      mode: 'date',
      theme: 'auto',
      value: currentDate.toISOString(),
      locale: 'default',
    });

    if (value) {
      const selectedDate = new Date(value);

      birthdayInput.value = {
        day: selectedDate.getDate(),
        month: selectedDate.getMonth() + 1,
        year: selectedDate.getFullYear(),
      };

      const localizedDateString = selectedDate.toLocaleDateString(undefined, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      displayedBirthday.value = localizedDateString;
    }
  } catch (error) {
    console.error('Datetime picker error:', error);
  }
};
</script>

<style scoped>
.custom-icon {
  margin-left: 3vw;
  margin-right: 0vw;
  font-size: 24px;
}
.invisible-icon {
  color: rgba(0, 0, 0, 0);
}
</style>