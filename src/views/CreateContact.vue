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
          <ion-icon class="custom-icon m-auto" :icon="personOutline" aria-hidden="true"></ion-icon>
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
              <ion-input v-model="birthday" inputmode="none" :readonly="true" label="Geburtstag" label-placement="floating"></ion-input>
            </ion-item>
          </ion-col>
        </ion-row>
      </ion-grid>
    </ion-content>
  </ion-page>
</template>


<script lang="ts">
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonPage,
  IonToolbar,
  IonBackButton,
  IonButton,
  IonButtons,
  IonList,
  IonItem,
  IonInput,
  IonIcon,
  alertController
} from '@ionic/vue';
import { closeOutline, personOutline, callOutline, calendarOutline, mailOutline } from 'ionicons/icons';
import {
  Contacts,
  CreateContactOptions,
  ContactInput,
  CreateContactResult,
  PhoneType,
  EmailType,
} from '@capacitor-community/contacts';
import { DatetimePicker } from '@capawesome-team/capacitor-datetime-picker';

export default {
  components: {
    IonContent,
    IonHeader,
    IonTitle,
    IonPage,
    IonToolbar,
    IonBackButton,
    IonButton,
    IonButtons,
    IonList,
    IonItem,
    IonInput,
    IonIcon,
    alertController,
    Contacts
  },
  data() {
    return {
      closeOutline,
      personOutline,
      callOutline,
      calendarOutline,
      mailOutline,
      firstName: '',
      lastName: '',
      phoneNumber: '',
      email: '',
      birthday: '',
      selectedDate: '',
    };
  },
  methods: {
    /**
     * Creates a new contact using the provided input fields.
     */
    async createContact() {
      // Check for missing data
      if (!this.firstName.trim() && !this.lastName.trim() && !this.phoneNumber.trim() && !this.email.trim() && !this.birthday.trim()) {
        // Display an alert if there's missing data
        const alert = await alertController.create({
          header: 'Missing Information',
          message: 'Please fill in at least one field to create the contact.',
          buttons: ['OK'],
        });

        await alert.present();
        return; // Exit the function if there's missing data
      }

      // Construct the newContact object
      const newContact: ContactInput = {
        name: {
          given: this.firstName.trim() !== '' ? this.firstName.trim() : undefined,
          family: this.lastName.trim() !== '' ? this.lastName.trim() : undefined,
        },
        phones: this.phoneNumber.trim() !== '' ? [{
          type: PhoneType.Home,
          number: this.phoneNumber.trim(),
        }] : [],
        emails: this.email.trim() !== '' ? [{
          type: EmailType.Work,
          address: this.email.trim(),
        }] : [],
        birthday: this.birthday.trim() !== '' ? {
          day: new Date(this.birthday).getDate(),
          month: new Date(this.birthday).getMonth() + 1,
          year: new Date(this.birthday).getFullYear(),
        } : undefined,
      };

      // Use the createContact API function to create the contact
      const createContactOptions: CreateContactOptions = {
        contact: newContact,
      };

      try {
        const result: CreateContactResult = await Contacts.createContact(createContactOptions);
        const createdContactId = result.contactId;

        // Redirect to the contacts page after successful creation
        try {
          this.$router.push({ name: 'contacts', query: { reloadView: 'true' } });
        } catch (error) {
          console.error("Routing Error", error);
        }
      } catch (error) {
        console.error('Error creating contact:', error);
        const alert = await alertController.create({
          header: 'Error',
          message: 'An error occurred while creating the contact.',
          buttons: ['OK'],
        });

        await alert.present();
      }
    },

    /**
     * Opens the date picker for selecting the contact's birthday.
     */
    async openBirthdayPicker() {
      try {
        const currentDate = new Date();

        const { value } = await DatetimePicker.present({
          mode: 'date',
          theme: 'auto',
          value: currentDate.toISOString(),
          locale: 'default', // Use 'default' to get the user's preferred locale
        });

        if (value) {
          // Parse the selected date to a localized string using the user's locale
          const selectedDate = new Date(value);
          const localizedDateString = selectedDate.toLocaleDateString(undefined, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          });
          this.birthday = localizedDateString;
        }
      } catch (error) {
        console.error('Datetime picker error:', error);
      }
    },
  },
};
</script>



<style>
.custom-icon {
  margin-left: 5vw;
  margin-right: 5vw;
}
.invisible-icon {
  color: rgba(0, 0, 0, 0); /* Make the icon fully transparent */
}
</style>