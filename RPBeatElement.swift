//
//  RPBeatElement.swift
//  Rapunzel
//
//  Created by Simon Kemper on 25.04.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit

enum RPBeatElementType {
    case LeftTreePlatform
    case RightTreePlatform
    case Empty
}

struct RPBeatElement {
    
    let type: RPBeatElementType
    
    /// Closure that passes code that will be called when the RPBeatElement is being created by an RPPatternControllerComponent
    let creationHandler: (offset: CGFloat, entityManagerComponent: RPEntityManagerComponent) -> RPPlatformEntity

}
