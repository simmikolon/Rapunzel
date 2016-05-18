//
//  BeatElement.swift
//  Rapunzel
//
//  Created by Simon Kemper on 25.04.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit

enum BeatElementType {
    case LeftTreePlatform
    case RightTreePlatform
    case Empty
}

struct BeatElement {
    
    let type: BeatElementType
    
    /// Closure that passes code that will be called when the BeatElement is being created by an PatternControllerComponent
    let creationHandler: (offset: CGFloat, entityManager: EntityManager) -> PlatformEntity

}
