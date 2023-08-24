<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-button router-link="contacts/create" fill="clear" expand="full" class="text-icon-button" color="black">
          <ion-icon slot="start" :icon="personAddOutline"></ion-icon>
          Neuen Kontakt erstellen
        </ion-button>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-list>
        <ion-item v-for="contact in sortedContacts" :key="contact.contactId" :router-link="`/contacts/${contact.contactId}`">
          <ion-avatar class="custom-avatar">
            <img alt="Avatar" :src="defaultAvatarUrl" />
          </ion-avatar>
          {{ getDisplayName(contact) }}
        </ion-item>
      </ion-list>
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
  alertController,
} from '@ionic/vue';
import { Contacts, ContactPayload } from '@capacitor-community/contacts';
import { personAddOutline } from "ionicons/icons";
import { App } from '@capacitor/app';

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
  },
  data() {
    return {
      personAddOutline: personAddOutline,
      defaultAvatarUrl: 'resources/avatar.svg',
      contacts: [] as ContactPayload[],
      componentKey: 0,
    };
  },
  computed: {
    sortedContacts() {
      return this.contacts.slice().sort((a, b) => {
        const firstNameA = (a.name && a.name.given) || '';
        const firstNameB = (b.name && b.name.given) || ''; 
        return firstNameA.localeCompare(firstNameB);
      });
    },
  },
  watch: {
    '$route.query.reloadView': {
      immediate: true,
      handler(reloadViewParam) {
        if (reloadViewParam === 'true') {
          // New contact has been added, fetch contacts again
          this.$forceUpdate();
        }
      },
    },
  },
  methods: {
    /**
     * Retrieves contacts from the device's contacts and updates the component's contacts list.
     */
    async retrieveContacts() {
      try {
        const response = await Contacts.requestPermissions();
        console.log('Contacts permission response: ', response);

        if (response.contacts === 'granted') {
          console.log('Granted permissions for contacts');
          const projection = {
            name: true,
            phones: true,
          };

          const result = await Contacts.getContacts({ projection });
          console.log('Got contacts result: ', result);

          // Handle the retrieved contacts, e.g., assign them to a variable
          this.contacts = result.contacts;
          // Further processing with the contacts data
        } else {
          console.log('Contacts permission not granted yet');

          const alert = await alertController.create({
            header: 'Permission Required',
            message: 'This app requires access to your contacts. Grant permission to proceed.',
            buttons: [
              {
                text: 'Exit',
                handler: () => {
                  App.exitApp();
                },
              },
              {
                text: 'Try again',
                handler: () => {
                  this.retrieveContacts(); // Retry retrieval
                },
              },
            ],
          });

          await alert.present();
        }
      } catch (error) {
        console.error('Error requesting or getting contacts permission: ', error);
      }
    },

    /**
     * Generates a display name for the given contact.
     * @param contact - The contact for which to generate the display name.
     * @returns The generated display name.
     */
    getDisplayName(contact: ContactPayload) {
      const { name, phones } = contact;

      if (name && (name.given || name.family)) {
        const firstName = name.given || '';
        const lastName = name.family || '';
        return `${firstName} ${lastName}`;
      } else if (phones && phones.length > 0) {
        return phones[0].number; // Display the first phone number if no name is available
      } else {
        return 'Unknown';
      }
    },
  },
  mounted() {
    this.retrieveContacts();
  },
};
</script>

<style>
/* Add your custom styles here */
</style>
