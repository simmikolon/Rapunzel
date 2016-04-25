//
//  RPDebugPlatformEntity.swift
//  Rapunzel
//
//  Created by Simon Kemper on 02.02.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import GameplayKit
import SpriteKit

enum RPDebugPlatformAnimationName: String {
    
    case Normal = "RPDebugPlatformNormal"
    case JumpingOn = "RPDebugPlatformJumpingOn"
    case JumpingOff = "RPDebugPlatformJumpingOff"
    case BottomHit = "RPDebugPlatformBottomHit"
    
    static let atlasNames = [
        
        Normal.rawValue,
        JumpingOn.rawValue,
        JumpingOff.rawValue,
        BottomHit.rawValue
    ]
}

class RPDebugPlatformEntity: RPPlatformEntity, RPResourceLoadableType {
    
    static var animations: [String: RPAnimation]!
    
    init(isBreakable breakable: Bool, isBottomCollidable bottomCollidable: Bool) {
        
        guard let animations = RPDebugPlatformEntity.animations else {
            fatalError()
        }
        
        super.init(isBreakable: breakable, isBottomCollidable: bottomCollidable, animations: animations)
    }
}

extension RPDebugPlatformEntity {
    
    static var resourcesNeedLoading: Bool {
        return true
    }
    
    static func loadResourcesWithCompletionHandler(completionHandler: () -> ()) {
        
        SKTextureAtlas.preloadTextureAtlasesNamed(RPDebugPlatformAnimationName.atlasNames) { error, atlases in
            
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
