//
//  RPBranchPlatformEntity.swift
//  Rapunzel
//
//  Created by Simon Kemper on 03.03.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import GameplayKit
import SpriteKit

enum RPBranchPlatformAnimationName: String {
    
    case Normal = "RPBranchPlatformNormal"
    case JumpingOn = "RPBranchPlatformJumpingOn"
    case JumpingOff = "RPBranchPlatformJumpingOff"
    case BottomHit = "RPBranchPlatformBottomHit"
    
    static let atlasNames = [
        
        Normal.rawValue,
        JumpingOn.rawValue,
        JumpingOff.rawValue,
        BottomHit.rawValue
    ]
}

class RPBranchPlatformEntity: RPPlatformEntity, RPResourceLoadableType {
    
    static var animations: [String: RPAnimation]!
    
    init(isBreakable breakable: Bool, isBottomCollidable bottomCollidable: Bool) {
        
        guard let animations = RPBranchPlatformEntity.animations else {
            fatalError()
        }
        
        super.init(isBreakable: breakable, isBottomCollidable: bottomCollidable, animations: animations)
    }
}

extension RPBranchPlatformEntity {
    
    static var resourcesNeedLoading: Bool {
        return animations == nil
    }
    
    static func loadResourcesWithCompletionHandler(completionHandler: () -> ()) {
        
        SKTextureAtlas.preloadTextureAtlasesNamed(RPBranchPlatformAnimationName.atlasNames) { error, atlases in
            
            if let error = error { fatalError("Fatal Error beim Preloading der TextureAtlases: \(error)") }
            
            animations = [:]
            
            animations[RPPlatformAnimationName.Normal.rawValue] = RPAnimationComponent.animationsFromAtlas(atlases[0])
            animations[RPPlatformAnimationName.JumpingOn.rawValue] = RPAnimationComponent.animationsFromAtlas(atlases[1])
            animations[RPPlatformAnimationName.JumpingOff.rawValue] = RPAnimationComponent.animationsFromAtlas(atlases[2])
            animations[RPPlatformAnimationName.BottomHit.rawValue] = RPAnimationComponent.animationsFromAtlas(atlases[3])
            
            completionHandler()
        }
    }
    
    static func purgeResources() {
        
        animations = nil
    }
    
}

