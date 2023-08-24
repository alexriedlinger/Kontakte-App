<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons>
          <ion-back-button default-href="/contacts"></ion-back-button>
        </ion-buttons>
        <ion-buttons slot="end">
          <ion-button slot="icon-only" fill="clear" name="delete" shape="round" @click="confirmContactDeletion">
            <ion-icon :icon="trashSharp" size=""></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-item lines="none" class="avatar-item">
        <ion-avatar class="big-avatar">
          <img alt="Avatar" :src="defaultAvatarUrl" />
        </ion-avatar>
      </ion-item>
      <div class="ion-text-center">
        <ion-text>{{ fullName }}</ion-text>
      </div>
      <ion-list >
        <ion-item-sliding>
          <ion-item lines="none" :detail="false" >
            <ion-icon class="custom-icon" :icon="callOutline" color="black"></ion-icon>
            <ion-text>{{ phoneNumber }}</ion-text>
          </ion-item>
          <ion-item-options>
            <ion-item-option @click="call(phoneNumber)" color="success" style="width: 15vw;">
              <ion-icon :icon="callSharp" size="large"></ion-icon>
            </ion-item-option>
            <ion-item-option @click="copyToClipboard(phoneNumber)" style="width: 15vw;">
              <ion-icon :icon="copy" size="large"></ion-icon>
            </ion-item-option>
          </ion-item-options>
        </ion-item-sliding>
        <ion-item-sliding>
          <ion-item lines="none" :detail="false">
            <ion-icon class="custom-icon" :icon="mailOutline" color="black"></ion-icon>
            <ion-text>{{ email }}</ion-text>
          </ion-item>
          <ion-item-options>
            <ion-item-option @click="sendEmail(email)" color="success" style="width: 15vw;">
              <ion-icon :icon="mail" size="large"></ion-icon>
            </ion-item-option>
            <ion-item-option @click="copyToClipboard(email)" style="width: 15vw;">
              <ion-icon :icon="copy" size="large"></ion-icon>
            </ion-item-option>
          </ion-item-options>
        </ion-item-sliding>
        <!-- Birthday -->
        <ion-item lines="none">
          <ion-icon class="custom-icon" :icon="calendarOutline" color="black"></ion-icon>
          <ion-text>{{ birthday }}</ion-text>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>


<script lang="ts">
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonBackButton,
  IonContent,
  IonItem,
  IonAvatar,
  IonText,
  IonButton,
  IonButtons,
  IonIcon,
  IonItemSliding,
  alertController,
} from '@ionic/vue';
import { callOutline, calendarOutline, mailOutline, trashSharp, callSharp, copy, mail, } from 'ionicons/icons';
import { Contacts, ContactPayload, GetContactOptions } from '@capacitor-community/contacts';
import { useRoute } from 'vue-router';
import { Clipboard } from '@capacitor/clipboard'; // Import Clipboard module
import { EmailComposer } from 'capacitor-email-composer'
import { CallNumber } from '@awesome-cordova-plugins/call-number'

export default {
  components: {
    IonPage,
    IonHeader,
    IonToolbar,
    IonBackButton,
    IonContent,
    IonItem,
    IonAvatar,
    IonText,
    IonButton,
    IonIcon,
  },

  data() {
    return {
      id: '',
      callOutline,
      calendarOutline,
      mailOutline,
      trashSharp,
      callSharp,
      copy,
      mail,
      phoneNumber: '',
      email: '',
      birthday: '',
      image: '',
      fullName: '',
      defaultAvatarUrl: 'resources/avatar.svg',
    };
  },

  async created() {
    try {
      const route = useRoute();
      const { id } = route.params;
      this.id = Array.isArray(id) ? id[0] : id;
      const options: GetContactOptions = {
        contactId: this.id,
        projection: {
          name: true,
          phones: true,
          emails: true,
          birthday: true,
        },
      };

      const result = await Contacts.getContact(options);

      if (result && result.contact) {
        const contact = result.contact;
        this.fullName = this.getDisplayName(contact);
        this.phoneNumber = contact.phones && contact.phones.length > 0 ? contact.phones[0].number! : '';
        this.email = contact.emails && contact.emails.length > 0 ? contact.emails[0].address! : '';
        this.birthday = this.formatBirthday(contact.birthday);
      } else {
        console.error('Selected contact not found.');
      }
    } catch (error) {
      console.error('Error fetching selected contact:', error);
    }
  },

  methods: {
    /**
     * Formats a birthday object into a human-readable date string.
     * @param birthday - The birthday object to format.
     * @returns The formatted birthday string.
     */
    formatBirthday(birthday: any): string {
      if (birthday && birthday.year && birthday.month && birthday.day) {
        const { day, month, year } = birthday;
        return `${day.toString().padStart(2, '0')}.${month.toString().padStart(2, '0')}.${year}`;
      } else {
        return '';
      }
    },

    /**
     * Generates a display name for the given contact.
     * @param contact - The contact for which to generate the display name.
     * @returns The generated display name.
     */
    getDisplayName(contact: ContactPayload): string {
      const { name } = contact;
      if (name && (name.given || name.family)) {
        const firstName = name.given || '';
        const lastName = name.family || '';
        return `${firstName} ${lastName}`;
      } else {
        return '';
      }
    },

    /**
     * Displays a confirmation dialog for contact deletion.
     */
    async confirmContactDeletion() {
      const alert = await alertController.create({
        header: 'Confirm Deletion',
        message: 'Are you sure you want to delete this contact?',
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
          },
          {
            text: 'Delete',
            handler: () => {
              this.deleteContact();
            },
          },
        ],
      });

      await alert.present();
    },

    /**
     * Deletes the currently displayed contact.
     */
    async deleteContact() {
      try {
        await Contacts.deleteContact( {
          contactId: this.id 
        });

        // Optionally, you can redirect the user to the contacts list after deletion
        this.$router.push({ name: 'contacts', query: { reloadView: 'true' } });
      } catch (error) {
        console.error('Error deleting contact:', error);
      }
    },

    /**
     * Initiates a phone call to the provided phone number.
     * @param phoneNumber - The phone number to call.
     */
    call(phoneNumber: string) {
      CallNumber.callNumber(phoneNumber, true);
    },

    /**
     * Opens the default email composer with the provided email address.
     * @param email - The email address to pre-fill in the composer.
     */
    sendEmail(email: string) {
      EmailComposer.open({
        to: [email]
      });
    },

    /**
     * Copies the provided string to the device clipboard.
     * @param string - The string to copy to the clipboard.
     */
    async copyToClipboard(string: string) {
      await Clipboard.write({
        string: string
      });
    },
  },
};
</script>

<style>
.avatar-item {
  margin-top: 10vw; /* Adjust the margin as needed */
  margin-bottom: 10vw;
}

.big-avatar {
  width: 45vw; /* Adjust the width as needed */
  height: 45vw; /* Adjust the height to maintain aspect ratio */
  margin: 0 auto;
}
.text-icon-button {
    width: 100%; /* Set a fixed width for the buttons */
    text-align: left; /* Align the text to the left within the buttons */
    display: block; /* Make sure each button takes up the full width */
  }
.custom-icon {
  margin-right: 5vw;
}
</style>
