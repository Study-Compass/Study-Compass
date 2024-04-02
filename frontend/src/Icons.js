import Outlets from './assets/Icons/Outlets.svg';
import Windows from './assets/Icons/Windows.svg';
import Printer from './assets/Icons/Printer.svg';
import FilledStar from './assets/Icons/FilledStar.svg';
import Bookmark from './assets/Icons/Bookmark.svg';
import Edit from './assets/Icons/Edit.svg';
import Delete from './assets/Icons/Delete.svg';
import EmptyStar from './assets/Icons/EmptyStar.svg';
import Guide from './assets/Icons/Guide.svg';
import Logout from './assets/Icons/Logout.svg';
import Profile from './assets/Icons/Profile.svg';
import Settings from './assets/Icons/Settings.svg';
import Trash from './assets/Icons/Trash.svg';
import Google from './assets/Icons/Google.svg';


const attributeIcons = {
    "outlets": Outlets,
    "windows": Windows,
    "printer": Printer
};

const generalIcons = {
    "filledStar": FilledStar,
    "bookmark": Bookmark,
    "edit": Edit,
    "delete": Delete,
    "emptyStar": EmptyStar,
    "guide": Guide,
    "logout": Logout,
    "profile": Profile,
    "settings": Settings,
    "trash": Trash,
    "google": Google,
    ...attributeIcons,
};

export { attributeIcons, generalIcons };